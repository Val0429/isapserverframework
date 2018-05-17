import * as express from 'express';
import * as fs from 'fs';
import * as p from 'path';

var defaultPath = "index";

export function routerLoader(app, path, first = true) {
    var name = p.parse(path).name;

    if (fs.lstatSync(path).isDirectory()) {
        var files = fs.readdirSync(path);
        if (!first) {
            var router = express.Router();
            app.use(`/${name}`, router);
            app = router;
        }

        for (var file of files) {
            routerLoader(app, `${path}/${file}`, false);
        }

    } else {
        var route = require(`${path}`).default;
        if (name == defaultPath) name = "";
        app.use(`/${name}`, route);
    }
}