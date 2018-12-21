import { Restful } from "helpers/cgi-helpers";
import * as fs from 'fs';
import { Log } from "helpers/utility";

/**
 * Val: This is a special shell.
 * Not working like others, include it has no effect.
 */

var template = `
export class YOUR_SERVER extends Restful.iSAPServerBase<RestfulRequest> {

}

interface RestfulRequest extends Restful.ApisRequestBase {
{0}
}
`;

export default function main(path: string, config: Restful.ApisOutput, typeless: boolean = true) {
    createClass(path, config, typeless);
    process.exit(0);
}

function autoPad(input: string, value: number) {
    return input.replace(
        new RegExp(`^[^\r\n]`, "gm"),
        (a, b) => Array(value+1).join(" ")+a
    );
}

function getPos(origin: string): { spos: number, epos: number } {
    var regex = /^.*Restful.Server.*$/m;
    var spos, epos;
    origin.replace(regex, (a, b) => {
        spos = b;
        for (;b<origin.length;++b) { /* find first b */ if (origin[b] === '(') break; }
        var braclets = 0, end = false;
        for (;b<origin.length;++b) {
            /// find first b
            var char = origin[b];
            if (end === true) {
                if (char === '\n') {
                    epos = b+1;
                    break;
                }
                continue;
            }
            if (char === '(') ++braclets;
            else if (char === ')') --braclets;
            if (braclets === 0) end = true;
        }
        return a;
    });
    return { spos, epos };
}

function createClass(path: string, config: Restful.ApisOutput, typeless: boolean = true) {
    var origin = fs.readFileSync(path, "UTF-8");
    var { spos, epos } = getPos(origin);

    /// resolve interface
    let resolveObj = {};
    for (let path in config) {
        let pconfig = config[path];
        let type: Restful.ApisType;
        for (type in pconfig) {
            let pobj = pconfig[type];
            let typedef = `"${path}": [any, any, ${pobj.loginRequired ? 'true' : 'false'}],`;
            switch (type) {
                case 'All':
                    ['Get', 'Post'].forEach( (type) => {
                        let ary = resolveObj[type] = resolveObj[type] || [];
                        ary.push(typedef);
                    });
                    break;
                default:
                    let ary = resolveObj[type] = resolveObj[type] || [];
                    ary.push(typedef); break;
            }
        }
    }

    /// concat interfaces
    let ifstmp = [];
    for (let type in resolveObj) {
        let data = resolveObj[type];
        ifstmp.push([
            autoPad(`"${type}": {`, 4),
            autoPad(`${data.join("\r\n")}`, 8),
            autoPad(`},`, 4)
        ].join("\r\n"));
    }

    var data = [
        origin.substring(0, spos),
        template.replace( /\{0\}/mg, ifstmp.join("\r\n") ),
        origin.substring(epos || origin.length, origin.length)
    ].join("");
    

    Log.Info("Restful.Server", `Resolved for path <${path}>.`);
    fs.writeFileSync(path, data);
}
