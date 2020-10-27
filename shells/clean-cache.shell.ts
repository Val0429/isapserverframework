/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

const os = require('os');
const fs = require('fs');
const rimraf = require('rimraf');
const isWindows = process.platform === "win32";

let paths = [os.tmpdir()];
if (isWindows) paths.push("C:\\Windows\\Temp\\");

paths.forEach( (path) => {
    fs.readdir(path, (err, filenames) => {
        let regex = /^ts-node/i;
        for (let filePath of filenames) {
            if (regex.test(filePath)) {
                rimraf.sync(`${path}/${filePath}`);
            }
        }
    });
});
