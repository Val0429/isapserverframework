import * as express from 'express';
import * as fs from 'fs';
import * as p from 'path';
import { Action } from './../../helpers/cgi-helpers/core';
import { autoPad } from './../../helpers/shells/shell-writer';

var defaultPath = "index";
export var actions: Action[] = [];

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

    var gettypesFromActionClassic = (route: express.Router) => {
        var router: any = route;
        var stack = router.stack;
        var methods = stack[0].route.methods;
        var types = [];
        var protos = ["get", "post", "put", "delete"];
        if (methods["_all"]) types.push("ALL");
        for (var proto of protos) {
            if (methods[proto])
                types.push(proto.toUpperCase());
        }
        return types;
    }

    var loadRouteFromPath = (path: string) => {
        var route: Action;
        try { route = require(`${path}`).default; } catch(reason) { return null; }
        if (!route) throw `${path} has no default export.`;
        return route;
    }

    var getTypesFromPath = (path: string) => {
        var route: Action = loadRouteFromPath(path);
        var types = [];
        if (!route) return types;
        if (route instanceof Action) {
            types = getTypesFromAction(route);
        } else {
            types = gettypesFromActionClassic(route);
        }
        return types;
    }

    var printChild = (name: string, types: Array<string>, root: boolean = true) => {
        if (root) {
            var msg = ["\x1b[1m\x1b[32m", autoPad(`/${name}`, 3*level), "\x1b[0m"];
            if (types && types.length > 0) {
                msg = [...msg.slice(0, msg.length-1), `(${types.join(", ")})`];
            }
            console.log(...msg, "\x1b[0m");

        } else {
            if (name) console.log("\x1b[33m", autoPad(`-->${name}`, 3*level), types.length == 0 ? '' : `(${types.join(", ")})`, "\x1b[0m");
        }
    }

    if (first) {
        /// message ///
        if (app) console.log("\x1b[35m", "Mounting Cgi Tree...", "\x1b[0m");
        /// normalize cgiPath
        cgiPath = "/" + ( cgiPath ? ((cgiPath.match(/([a-z0-9].*)/gi) || [""])[0]) : "" );
        /// load sub directory
        var router = express.Router();
        if (app !== null) {
            app.use(cgiPath, router);
            app = router;
        }
    }
    ///////////////

    if (fs.lstatSync(path).isDirectory()) {
        var files = fs.readdirSync(path);
        if (!first) {
            var router = express.Router();
            if (app !== null) {
                app.use(`/${name}`, router);
                app = router;
            }
            /// message ///
            var types = getTypesFromPath(`${path}/${defaultPath}`);
            printChild(name, types, true);
            ///////////////
        }

        for (var file of files) {
            routerLoader(app, `${path}/${file}`, cgiPath, false, first ? 0 : level+1);
        }

    } else {
        var route: Action = loadRouteFromPath(path);
        var routename = name === defaultPath ? (name = "", "($)") : name;

        var types = [];
        if (route instanceof Action) {
            actions.push(route);
            if (app !== null) app.use(`/${routename}`, route.mount());
            /// message ///
            types = getTypesFromAction(route);
            ///////////////

        } else {
            if (app !== null) app.use(`/${routename}`, route);
            types = gettypesFromActionClassic(route);
        }

        /// message ///
        printChild(name, types, level === 0 ? true : false);
        // if (name) console.log("\x1b[33m", autoPad(`-->${name}`, 3*level), types.length == 0 ? '' : `(${types.join(", ")})`, "\x1b[0m");
        ///////////////
    }

    if (first) return actions;
}