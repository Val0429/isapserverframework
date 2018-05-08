import * as fs from 'fs';
import * as p from 'path';

export default function(app, path) {
    var files = fs.readdirSync(path);
    for (var o of files) {
        var file = p.parse(o).name;
        var route = require(`${path}/${file}`).default;
        app.use(`/${file}`, route);
    }
};