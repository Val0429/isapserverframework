import * as express from 'express';
import * as fs from 'fs';
import * as p from 'path';
import { Action } from './../../core/cgi-package';
import { autoPad } from './../../helpers/shells/shell-writer';

var defaultPath = "index";
var actions: Action[] = [];

/// meant to be called only once
export function routerLoader(app, path, cgiPath = null, first = true, level = 0): Action[] {
    var name = p.parse(path).name;

    var getTypesFromAction = (route: Action) => {
        if (route === null) return null;
        var types = [];
        var protos = ["All", "Get", "Post", "Put", "Delete", "Ws"];
        for (var proto of protos)
            if (route[`func${proto}`])
                types.push(proto.toUpperCase());
        return types;
    }

    var loadRouteFromPath = (path: string) => {
        try {
            var route: Action = require(`${path}`).default;
            return route;
        } catch(e) {
            return null;
        }
    }

    var getTypesFromPath = (path: string) => getTypesFromAction( loadRouteFromPath(path) );

    var printChild = (name: string, types: Array<string>, root: boolean = true) => {
        if (root) {
            var msg = ["\x1b[1m\x1b[32m", autoPad(`/${name}`, 3*level), "\x1b[0m"];
            if (types) {
                msg = [...msg.slice(0, msg.length-1), `(${types.join(", ")})`, "\x1b[0m"];
            }
            console.log(...msg);

        } else {
            if (name) console.log("\x1b[33m", autoPad(`-->${name}`, 3*level), types.length == 0 ? '' : `(${types.join(", ")})`, "\x1b[0m");
        }
    }

    if (first) {
        /// message ///
        console.log("\x1b[35m", "Mounting Cgi Tree...", "\x1b[0m");
        /// normalize cgiPath
        cgiPath = "/" + (cgiPath.match(/([a-z0-9].*)/gi) || [""])[0];
        /// load sub directory
        var router = express.Router();
        app.use(cgiPath, router);
        app = router;
    }
    ///////////////

    if (fs.lstatSync(path).isDirectory()) {
        var files = fs.readdirSync(path);
        if (!first) {
            var router = express.Router();
            app.use(`/${name}`, router);
            app = router;
            /// message ///
            var types = getTypesFromPath(`${path}/${defaultPath}`);
            printChild(name, types, true);
            // var msg = ["\x1b[1m\x1b[32m", autoPad(`/${name}`, 3*level), "\x1b[0m"];
            // var types = getTypesFromPath(`${path}/${defaultPath}`);
            // if (types) {
            //     msg = [...msg.slice(0, msg.length-1), `(${types.join(", ")})`, "\x1b[0m"];
            // }
            // console.log(...msg);
            ///////////////
        }

        for (var file of files) {
            routerLoader(app, `${path}/${file}`, cgiPath, false, first ? 0 : level+1);
        }

    } else {
        var route: Action = require(`${path}`).default;
        var routename = name === defaultPath ? (name = "", "($)") : name;

        var types = [];
        if (route instanceof Action) {
            actions.push(route);
            app.use(`/${routename}`, route.mount());
            /// message ///
            types = getTypesFromAction(route);
            ///////////////

        } else app.use(`/${routename}`, route);

        /// message ///
        printChild(name, types, level === 0 ? true : false);
        // if (name) console.log("\x1b[33m", autoPad(`-->${name}`, 3*level), types.length == 0 ? '' : `(${types.join(", ")})`, "\x1b[0m");
        ///////////////
    }

    if (first) return actions;
}