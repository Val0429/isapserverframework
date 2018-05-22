import * as express from 'express';
import * as fs from 'fs';
import * as p from 'path';
import { Action } from './../../core/cgi-package';
import { autoPad } from './../../helpers/shells/shell-writer';

var defaultPath = "index";

export function routerLoader(app, path, first = true, level = 0) {
    var name = p.parse(path).name;

    /// message ///
    if (first) console.log("\x1b[35m", "Mounting Cgi Tree...", "\x1b[0m");
    ///////////////

    if (fs.lstatSync(path).isDirectory()) {
        var files = fs.readdirSync(path);
        if (!first) {
            var router = express.Router();
            app.use(`/${name}`, router);
            app = router;
            /// message ///
            console.log("\x1b[1m\x1b[32m", autoPad(`/${name}`, 3*level), "\x1b[0m");
            ///////////////
        }

        for (var file of files) {
            routerLoader(app, `${path}/${file}`, false, first ? 0 : level+1);
        }

    } else {
        var route: Action = require(`${path}`).default;
        if (name == defaultPath) name = "";

        var types = [];
        if (route instanceof Action) {
            app.use(`/${name}`, route.mount());
            /// message ///
            var protos = ["All", "Get", "Post", "Put", "Delete", "Ws"];
            for (var proto of protos)
                if (route[`func${proto}`])
                    types.push(proto);
            ///////////////

        } else app.use(`/${name}`, route);

        /// message ///
        console.log("\x1b[33m", autoPad(`-->${name}`, 3*level), types.length == 0 ? '' : `(${types.join(", ")})`, "\x1b[0m");
        ///////////////
    }
}