/**
 * Val: This is a special shell.
 * Not working like others, include it has no effect.
 */

var template = `
var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<I{0}>;
type OutputC = Restful.OutputC<I{0}>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new {0}(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<I{0}>;
type OutputR = Restful.OutputR<I{0}>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query({0});
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<I{0}>;
type OutputU = Restful.OutputU<I{0}>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query({0}).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [\`{0} <\${objectId}> not exists.\`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<I{0}>;
type OutputD = Restful.OutputD<I{0}>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query({0}).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [\`{0} <\${objectId}> not exists.\`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
`;

var templateInterface = `
var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
action.post<{0}>({ inputType: "{0}" }, async (data) => {

});

/********************************
 * R: get object
 ********************************/
action.get<{0}, {0}>({ inputType: "{0}" }, async (data) => {
    return ParseObject.toOutputJSON(data);
});

/********************************
 * U: update object
 ********************************/
action.put<{0}>({ inputType: "{0}" }, async (data) => {

});

/********************************
 * D: delete object
 ********************************/
action.delete<{0}>({ inputType: "{0}" }, async (data) => {

});
/// CRUD end ///////////////////////////////////

export default action;
`;

import * as fs from 'fs';
import { Restful } from 'helpers/cgi-helpers/core';

export default function main(path: string, className: string, options: Restful.CRUDOptions, isClass: boolean = true) {
    if (isClass) createClass(path, className, options);
    else createInterface(path, className, options);
    process.exit(0);
}

function getPos(origin: string): { spos: number, epos: number } {
    var regex = /^.*Restful.CRUD.*$/m;
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

function createClass(path: string, className: string, options: Restful.CRUDOptions) {
    var origin = fs.readFileSync(path, "UTF-8");
    var { spos, epos } = getPos(origin);
    var data = [
        origin.substring(0, spos),
        template.replace( /\{0\}/mg, className ),
        origin.substring(epos || origin.length, origin.length)
    ].join("");

    console.log(`CRUD resolved for path <${path}>.`);
    fs.writeFileSync(path, data);
}


function createInterface(path: string, className: string, options: Restful.CRUDOptions) {
    var origin = fs.readFileSync(path, "UTF-8");
    var { spos, epos } = getPos(origin);
    var data = [
        origin.substring(0, spos),
        templateInterface.replace( /\{0\}/mg, className ),
        origin.substring(epos || origin.length, origin.length)
    ].join("");

    console.log(`CRUD resolved for path <${path}>.`);
    fs.writeFileSync(path, data);
}