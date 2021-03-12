/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as express from 'express';
import * as fs from 'fs';
import * as p from 'path';
import { Action } from 'helpers/cgi-helpers/core';
import { autoPad } from 'helpers/shells/shell-writer';
import { blockingKey, blockingException } from './router-block';

const defaultPath = "index";
const hiddenPath = "__api__";
export var actions: Action[] = [];

interface IRouterPath {
    path: string;
    types: string[];
}

/// meant to be called only once
export function routerLoader(app, path, cgiPath = null /* prefix of cgi path */, routeBasePath = '', first = true, level = 0): { actions: Action[], app: any } {
    if (!fs.existsSync(path)) return;
    let name = p.parse(path).name;
    if (name === hiddenPath) return;
    /// level0 block
    if (level === 0 && blockingKey && blockingKey.test(name)) {
        if (name !== blockingException) return;
    }

    var getTypesFromAction = (route: Action): IRouterPath[] => {
        if (route === null) return null;
        const protos = ["All", "Get", "Post", "Put", "Delete", "Ws"];
        let tmproute: { [path: string]: {[key: string]: boolean} } = {};
        let path = route.config.path || "/";
        for (let proto of protos) {
            let funcs = route[`func${proto}`];
            for (let func of funcs) {
                let path2 = (func.config||{}).path || path;
                // { config?: ActionConfig, callback: ActionCallback<T, U> }
                let curroute = tmproute[path2] || (tmproute[path2] = {});
                curroute[proto.toUpperCase()] = true;
            }
        }
        return Object.keys(tmproute)
            .reduce((final, path) => {
                final.push({
                    path,
                    types: Object.keys(tmproute[path])
                })
                return final;
            }, []);
    }

    var gettypesFromActionClassic = (route: express.Router): IRouterPath[] => {
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
        return [{ path: "/", types }];
    }

    var loadRouteFromPath = (path: string) => {
        var route: Action;
        let ext = p.extname(path).toLowerCase();
        if (!ext) { ext = ".ts"; path += ".ts"; }
        if (ext !== '.ts' || !fs.existsSync(path)) return null;
        try {
            route = require(`${path}`).default;
        } catch(reason) {
            throw reason;
        }
        if (!route) throw `${path} has no default export.`;
        return route;
    }

    var getTypesFromPath = (path: string): IRouterPath[] => {
        var route: Action = loadRouteFromPath(path);
        var types: IRouterPath[] = [];
        if (!route) return types;
        if (route instanceof Action) {
            types = getTypesFromAction(route);
            /// only take root for path
            types = types.reduce((final, value) => {
                if (value.path === "/") final.push(value);
                return final;
            }, []);

        } else {
            types = gettypesFromActionClassic(route);
        }
        return types;
    }

    const printChild = (name: string, router: IRouterPath[], root: boolean = true) => {
        router = router.sort((a, b) => a.path.localeCompare(b.path));

        if (root && router.length === 0) {
            console.log("\x1b[1m\x1b[32m", autoPad(`/${name}`, 3*level), "\x1b[0m");
            return;
        }

        for (let route of router) {
            let path = route.path;
            path = (!path || path === "/") ? '' : path;
            if (!root && !path && !name) continue;
            let types = route.types;
            let msg = ["\x1b[1m\x1b[32m", autoPad(`${root?'/':'-->'}${name}${path}`, 3*level), "\x1b[0m"];
            console.log("\x1b[33m", ...msg, types.length == 0 ? '' : `(${types.join(", ")})`, "\x1b[0m");
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
            var types: IRouterPath[] = getTypesFromPath(`${path}/${defaultPath}`);
            printChild(name, types, true);
            ///////////////
        }

        for (var file of files) {
            let callPath = first ? '' : `${routeBasePath}/${name}`;
            routerLoader(app, `${path}/${file}`, cgiPath, callPath, false, first ? 0 : level+1);
        }

    } else {
        var route: Action = loadRouteFromPath(path);
        if (route === null) return;
        var routename = name === defaultPath ? (name = "", "") : name;

        var types: IRouterPath[] = [];
        if (route instanceof Action) {
            route.uri = `${routeBasePath}${name ? `/${name}` : ''}`;
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
        ///////////////
    }

    if (first) return { actions, app };
}