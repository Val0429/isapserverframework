/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as fs from 'fs';
import * as p from 'path';
var caller = require('caller');

import 'colors';
import { Log } from 'helpers/utility';

function isDirectory(path: string) {
    return fs.lstatSync(path).isDirectory();
}

export function autoIndex(path: string) {
    path = p.resolve( p.parse(caller()).dir, path);
    const indexName: string = "index";
    function makeTemplate(path: string, force: boolean = false): string {
        let pp = p.parse(path);
        let dir = pp.dir ? `${pp.dir}/` : '';
        path = pp.name;
        /// don't import file other than ts
        if (pp.ext !== '.ts') return;
        /// don't import index file
        if (pp.name === indexName && !force) return;
        return `export * from './${dir}${path}';`;
    }

    /// 1) must be directory
    if (!isDirectory(path)) return;
    /// get all files
    let files = fs.readdirSync(path);

    let templates: string[] = [];
    for (let file of files) {
        let subpath = `${path}/${file}`;
        if (!isDirectory(subpath)) {
            templates.push( makeTemplate(file) );
        } else {
            /// load index file inside directory
            subpath = `${subpath}/index.ts`;
            if (fs.existsSync(subpath))
                templates.push( makeTemplate(`${file}/index.ts`, true) );
        }
    }
    let data = templates.filter( (p) => p ).join("\r\n");
    if (!data) data = "export default undefined;";
    data = `/**
 * WARNING: DON'T MODIFY THIS FILE.
 * this file is auto created. whatever you insert into this file will be overwritten.
 */
${data}`;

    /// 2) compare with current index file
    let indexPath = `${path}/${indexName}.ts`;
    let origin = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "UTF-8") : "";
    if (origin !== data) {
        fs.writeFileSync(indexPath, data);
        Log.Info("Indexing", `location: ${p.resolve(path)}.`);
    }
}
