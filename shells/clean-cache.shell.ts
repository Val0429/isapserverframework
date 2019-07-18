const os = require('os');
const fs = require('fs');
const rimraf = require('rimraf');

let path = os.tmpdir();
fs.readdir(path, (err, filenames) => {
    let regex = /^ts-node/i;
    for (let filePath of filenames) {
        if (regex.test(filePath)) {
            rimraf.sync(`${path}/${filePath}`);
        }
    }
});
