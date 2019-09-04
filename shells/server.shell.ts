/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { shellWriter2 } from 'helpers/shells/shell-writer';
import { Config } from 'core/config.gen';

var tHeader = `
"use strict";
/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import 'shells/events.shell';

import * as express from 'express';
import * as parse from 'parse-server';
import { expressWsRoutes } from 'helpers/middlewares/express-ws-routes';
import * as fs from 'fs';
import * as p from 'path';
import { noCache } from 'helpers/middlewares/no-cache';
import { accessControlAllowOrigin } from 'helpers/middlewares/access-control-allow-origin';
import { routerLoader } from 'helpers/routers/router-loader';
import { makeServerReady } from 'core/pending-tasks';
import * as ParseDashboard from 'parse-dashboard';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';
import { sharedMongoDB } from 'helpers/parse-server/parse-helper';
import { Action } from 'helpers/cgi-helpers/core';
import { Log } from 'helpers/utility';
import { deployWeb } from 'helpers/deploy-web';
import 'colors';
import { InMemoriableMongoDBAdapter } from 'helpers/parse-server/database-adapter/inmemoriable-mongodb-adapter';
import GridStoreAdapter from 'parse-server/lib/Adapters/Files/GridStoreAdapter';
import { mongoDBUrl } from 'helpers/mongodb/url-helper';

import { Config } from 'core/config.gen';

let app: express.Application = expressWsRoutes();
`;

var tDebugStack = `
var lj = require('longjohn');
lj.async_trace_limit = 20;
// process.on('uncaughtException', err => {
// });
`;

var tDisableCache = `
/// Disable Cache
if (Config.core.disableCache) app.use(noCache);
`;

var tAccessControlAllowOrigin = `
/// Allow Origin Access
if (Config.core.accessControlAllowOrigin) app.use(<any>accessControlAllowOrigin);
`;

var tLoadRouter = `
/// Load Routers!
var actions = routerLoader(app, \`\${__dirname}/../workspace/cgi-bin\`, Config.core.cgiPath);
Log.Info('API Loaded', \`Totally \${Action.count(actions)} APIs.\`);
`;

var tRunParseServer = `
let myServerUrl = !Config.core.httpDisabled ?
    \`http://localhost:\${Config.core.port}\` :
    \`https://localhost:\${Config.core.httpsPort}\`;

if (Config.mongodb.enable) {
    /// run parse server ////
    let serverURL = !Config.core.httpDisabled ?
        \`\${myServerUrl}\${Config.parseServer.serverPath}\` :
        \`\${myServerUrl}\${Config.parseServer.serverPath}\`;
    let databaseURI = mongoDBUrl();
    //let databaseURI = \`mongodb://\${!Config.mongodb.account?'':\`\${Config.mongodb.account}:\${Config.mongodb.password}@\`}\${Config.mongodb.ip}:\${Config.mongodb.port}/\${Config.mongodb.collection}\`;
    var ParseServer = new parse.ParseServer({
        //databaseURI,
        databaseAdapter: new InMemoriableMongoDBAdapter({uri: databaseURI, mongoOptions: {
            reconnectInterval: 2000,
            reconnectTries: 300000,
        }}),
        filesAdapter: new GridStoreAdapter(databaseURI),
        appId: Config.parseServer.appId,
        masterKey: Config.parseServer.masterKey,
        fileKey: Config.parseServer.fileKey,
        enableSingleSchemaCache: true,
        serverURL,
        sessionLength: Config.core.sessionExpireSeconds,
    });
    app.use(Config.parseServer.serverPath, ParseServer);
}
/////////////////////////
`;

var tRunParseDashboard = `
/// run parse dashboard ////
if (Config.mongodb.enable && Config.parseDashboard.enable) {
var Dashboard = new ParseDashboard({
    "apps": [
    {
        "serverURL": \`\${myServerUrl}\${Config.parseServer.serverPath}\`,
        "appId": Config.parseServer.appId,
        "masterKey": Config.parseServer.masterKey,
        "appName": Config.parseDashboard.appName
    }
    ]
});
app.use(Config.parseDashboard.serverPath, Dashboard);
}
////////////////////////////
`;

var tRunWeb = `
let webPath = \`\${__dirname}/../workspace/custom/web\`;
deployWeb(webPath, app);
`;

var tFinalizeError = `
import { Errors } from 'core/errors.gen';
app.use( (reason, req, res, next) => {
    if (reason instanceof Errors) reason.resolve(res);
    else {
        Errors.throw(Errors.Custom, [reason.toString()]).resolve(res);
    }
});
`;

// var tRunServer = `
// import 'colors';
// app.listen(Config.core.port, async () => {
//     let packinfo = require(\`\${__dirname}/../package.json\`);
//     Log.Info(packinfo.config.displayname, \`running at port \${Config.core.port}.\`);

//     /// todo: this is a workaround. create database at the beginning.
//     let { ip, port, collection } = Config.mongodb;
//     let db = await sharedMongoDB();
//     await db.createCollection("_SCHEMA");
//     ////////////////////////////////////////////////////////////////

//     makeServerReady();
// });

// export {
//   app
// }
// `;

var tRunServer = `
let packinfo = require(\`\${__dirname}/../package.json\`);

let jobHttp = () => {
    if (Config.core.httpDisabled) return null;
    let http = require('http');
    return new Promise( (resolve) => {
        let httpServer = http.createServer(app);
        httpServer.wsServer = expressWsRoutes.createWebSocketServer(httpServer, app, {});
        httpServer.listen(Config.core.port, async () => {
            Log.Info(packinfo.config.displayname, \`running at port \${Config.core.port}. (http)\`);
            resolve();
        });
    });
}

let jobHttps = () => {
    if (!Config.core.httpsEnabled) return null;
    let https = require('https');
    return new Promise( (resolve) => {
        let key = fs.readFileSync(\`\${__dirname}/../workspace/custom/certificates/mykey.pem\`);
        let cert = fs.readFileSync(\`\${__dirname}/../workspace/custom/certificates/mycert.pem\`);
        let httpsServer = https.createServer({key, cert}, app);
        httpsServer.wsServer = expressWsRoutes.createWebSocketServer(httpsServer, app, {});
        httpsServer.listen(Config.core.httpsPort, async () => {
            Log.Info(packinfo.config.displayname, \`running at port \${Config.core.httpsPort}. (https)\`);
            resolve();
        });
    });
}

let jobCreateDB = () => {
    return new Promise( async (resolve) => {
        /// todo: this is a workaround. create database at the beginning.
        let { ip, port, collection } = Config.mongodb;
        let db = await sharedMongoDB();
        await db.createCollection("_SCHEMA");
        ////////////////////////////////////////////////////////////////
        resolve();
    });
}

(async () => {
    await Promise.all([jobHttp(), jobHttps(), jobCreateDB()]);
    makeServerReady();
})();

export {
  app
}
`;

// httpServer.listen(Config.core.port, async () => {
    
//     Log.Info(packinfo.config.displayname, \`running at port \${Config.core.port}. (http)\`);

//     /// todo: this is a workaround. create database at the beginning.
//     let { ip, port, collection } = Config.mongodb;
//     let db = await sharedMongoDB();
//     await db.createCollection("_SCHEMA");
//     ////////////////////////////////////////////////////////////////

//     await new Promise( (resolve) => {
//         if (Config.core.httpsEnabled) {
//             let key = fs.readFileSync(\`\${__dirname}/../workspace/custom/certificates/mykey.pem\`);
//             let cert = fs.readFileSync(\`\${__dirname}/../workspace/custom/certificates/mycert.pem\`);
//             let httpsServer = https.createServer({key, cert}, app);
//             httpsServer.wsServer = expressWsRoutes.createWebSocketServer(httpsServer, app, {});
//             httpsServer.listen(Config.core.httpsPort, async () => {
//                 Log.Info(packinfo.config.displayname, \`running at port \${Config.core.httpsPort}. (https)\`);
//             });
//         } else resolve();
//     });
    
//     makeServerReady();
// });

function autoPad(input: string, value: number) {
    return input.replace(
        new RegExp(`^ {${value},}`, "gm"),
        Array(value+1).join(" ")
    );
}

function main(): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    tmpstr.push(
        tHeader.replace(/^[\r\n]+/, '')
    );
    /////////////////////////////////////////////

    /// debug track /////////////////////////////
    tmpstr.push(tDebugStack);
    /////////////////////////////////////////////

    /// disable cache ///////////////////////////
    tmpstr.push(tDisableCache);
    /////////////////////////////////////////////

    /// access control //////////////////////////
    tmpstr.push(tAccessControlAllowOrigin);
    /////////////////////////////////////////////

    /// load router /////////////////////////////
    tmpstr.push(tLoadRouter);
    /////////////////////////////////////////////

    /// run parse server ////////////////////////
    tmpstr.push(tRunParseServer);
    /////////////////////////////////////////////

    /// run parse dashboard /////////////////////
    if (Config.parseDashboard.enable) tmpstr.push(tRunParseDashboard);
    /////////////////////////////////////////////

    /// run web /////////////////////////////////
    tmpstr.push(tRunWeb);
    /////////////////////////////////////////////

    /// finalize error //////////////////////////
    tmpstr.push(tFinalizeError);
    /////////////////////////////////////////////

    /// run server //////////////////////////////
    tmpstr.push(tRunServer);
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}


const genFilePath = `${__dirname}/../core/main.gen.ts`;
const tmplPath = `${__dirname}/server.shell.ts`;
import { Log } from 'helpers/utility';

import * as fs from 'fs';

shellWriter2(
    genFilePath,
    main(),
    () => {
        Log.Info("Code Generator", "Server file updated!");
    }
);

