/*
 * Created on Tue May 12 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import * as yesno from 'yesno';
import 'colors';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { padLeft, padRight } from './../helpers/utility/pad-left';

let outerpath = path.resolve(__dirname, "../");
let outercwd = outerpath;
let cwd = path.resolve(__dirname, "../", "workspace");
let packagejsonpath = path.resolve(cwd, "package.json");
let packagejson = require(packagejsonpath);
let nsispath = path.resolve(cwd, "nsis");

// let outerpackagejsonpath = path.resolve(outerpath, "package.json");
// let outerpackagejson = require(outerpackagejsonpath);

let version = packagejson.version;

export function increaseVersion(version: string): string {
    return version.split(".").map((value, index) => {
        if (index != 2) return value;
        return padLeft((+value) + 1, 2);
    }).join(".");
}

export function showError(value: string) {
    console.log("[錯誤]".bgRed + " " + value);
    process.exit(0);
}

export function findFilesInDir(startPath: string, filter) {

    var results = [];

    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }

    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
            results = results.concat(findFilesInDir(filename,filter)); //recurse
        }
        //else if (filename.indexOf(filter)>=0) {
        else if (filter.test(filename)) {
            results.push(filename);
        }
    }
    return results;
}

(async () => {
    console.log("[".yellow + "ServerFramework 打包程式" + "]".yellow);

    /// Q0
    const commithint = "nothing to commit, working tree clean";
    const pushhint = "Your branch is ahead of";
    const pullhint = "Your branch is behind";
    let gitstatus = execSync(`git status`, { cwd });
    let packagename = execSync(`git rev-parse --abbrev-ref HEAD`, { cwd }).toString("UTF-8").replace(/[\r\n]/, "");

    if (gitstatus.indexOf(commithint) < 0) showError("尚未commit，請先進行 commit / push。");
    if (gitstatus.indexOf(pushhint) >= 0) showError("尚未push，請先手動 push。");
    if (gitstatus.indexOf(pullhint) >= 0) showError("尚未pull至最新版本，請先手動pull。");

    /// Q Start
    console.log("回答以下問題，將可完成自動進版。");

    /// Q1
    const nversion = increaseVersion(version);
    let Q1 = await yesno({
        question: `
    問題一，是否自動升級版本 (${version.green}) => (${nversion.yellow.bold})
    若否，保留現在版本： `
    });
    if (Q1) version = nversion;

    /// Q2
    let newtag = `${packagename}_v${version}`;
    let Q2 = await yesno({
        question: `
    問題二，確認以下包版訊息
    專案名稱：${packagename}
    輸出tag：${newtag}
    是否正確？ `
    });
    if (!Q2) process.exit(0);
    
    /// Execute!
    do {
        /// 0) get username
        let gituser = execSync(`git config user.name`).toString("UTF-8").replace(/[\r\n]/, "");

        /// 0.1) get logs
        let gitlog = execSync(`git log --pretty="%ci{|}%an{|}%B{||}"`, { cwd });
        let logpath = path.resolve(cwd, "change.log");

        /// 1) unlink old one
        fs.unlinkSync(logpath);

        /// 2) split
        let lines: any = gitlog.toString("UTF-8").split("{||}");
        if (lines.length == 0) break;
        lines.pop();
        const ignoreloghint = [/^Merge branch/, /^Merge remote-tracking branch/, /^fixed$/, /^stable/];
        const regDate = /\ \+[0-9]+$/;
        lines = lines.reduce((final, line) => {
            let msgs = line.replace(/[\r\n]/g, "").split("{|}");
            msgs[0] = msgs[0].replace(regDate, "");
            if (ignoreloghint.filter(v => v.test(msgs[2])).length > 0) return final;
            final.push(msgs);
            return final;
        }, []);

        /// 3) add latest version
        let now = new Date();
        lines.unshift([
            `${now.getFullYear()}-${padLeft(now.getMonth()+1, 2)}-${padLeft(now.getDate(), 2)} ${padLeft(now.getHours(), 2)}:${padLeft(now.getMinutes(), 2)}:${padLeft(now.getSeconds(), 2)}`,
            gituser,
            `v${version}`
        ]);

        /// 4) calculate name length
        let maxlength = lines.reduce((final, value) => {
            final = Math.max(value[1].length, final);
            return final;
        }, 0);

        /// 5) write to log file
        let todowrite = lines.map(line => `${line[0]} -> author: ${padRight(line[1], maxlength, " ")} , message: ${line[2]}`).join("\r\n");
        fs.writeFileSync(logpath, todowrite, { encoding: "UTF-8" });

        /// 6) write package.json
        packagejson.version = version;
        packagejson.description = `${packagejson.config.displayname} v${version}`;
        let newjsontext = JSON.stringify(packagejson, null, '  ');
        fs.writeFileSync(packagejsonpath, newjsontext, { encoding: "UTF-8" });

        /// 6.5) write outer package.json
        // outerpackagejson.name = packagejson.name;
        // outerpackagejson.version = packagejson.version;
        // outerpackagejson.description = packagejson.description;
        // newjsontext = JSON.stringify(outerpackagejson, null, '  ');
        // fs.writeFileSync(outerpackagejsonpath, newjsontext, { encoding: "UTF-8" });

        /// 7) write all nsi
        let regex = /^(\!define\ PRODUCT_VERSION\ )\"([^\"]+)\"$/im;
        let nsisfiles = findFilesInDir(nsispath, /\.nsi$/);
        nsisfiles.forEach(nsisfile => {
            let data = fs.readFileSync(nsisfile, { encoding: "UTF-8" });
            data = data.replace(regex, (a, b, c) => `${b}"${version}"`);
            fs.writeFileSync(nsisfile, data, { encoding: "UTF-8" });
        });

        /// 8) add and commit
        execSync(`git add .`, { cwd });
        execSync(`git commit -m "v${version}"`, { cwd });
        try {execSync(`git tag -d "${newtag}"`, { cwd }); } catch(e) {}
        execSync(`git tag "${newtag}"`, { cwd });
        execSync(`git push -f --tags`, { cwd });
        execSync(`git push -f origin HEAD`, { cwd });

        /// 8.1) push serverframework tag
        try {execSync(`git tag -d "${newtag}"`, { cwd: outercwd }); } catch(e) {}
        execSync(`git tag "${newtag}"`, { cwd: outercwd });
        execSync(`git push -f --tags`, { cwd: outercwd });

        /// X) end
        process.exit(0);
    
    } while(0);

})();
