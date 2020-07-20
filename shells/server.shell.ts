/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { shellWriter2 } from 'helpers/shells/shell-writer';

var tHeader = `
/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

"use strict";

import * as express from 'express';
import * as parse from 'parse-server';
import { expressWsRoutes } from 'helpers/middlewares/express-ws-routes';
import * as fs from 'fs';
import { noCache } from 'helpers/middlewares/no-cache';
import { secureContentType } from 'helpers/middlewares/secure-content-type';
import { blockRobots } from 'helpers/middlewares/block-robots';
import { accessControlAllowOrigin } from 'helpers/middlewares/access-control-allow-origin';
import { routerLoader } from 'helpers/routers/router-loader';
import { makeServerReady } from 'core/pending-tasks';
import { sharedMongoDB } from 'helpers/parse-server/parse-helper';
import { Action } from 'helpers/cgi-helpers/core';
import { Log } from 'helpers/utility';
import { deployWeb } from 'helpers/deploy-web';
import 'colors';
import { InMemoriableMongoDBAdapter } from 'helpers/parse-server/database-adapter/inmemoriable-mongodb-adapter';
import GridStoreAdapter from 'parse-server/lib/Adapters/Files/GridStoreAdapter';
import { mongoDBUrl } from 'helpers/mongodb/url-helper';

import { Config } from 'core/config.gen';

const IsDebug: boolean = process.env.NODE_ENV === 'development';

let app: express.Application = expressWsRoutes();
`;

var tDebugStack = `
/// Debug Stack
(async () => {
    if (!IsDebug) return null;

    try {
        var longjohn = require('longjohn');
        longjohn.async_trace_limit = 20;
        // process.on('uncaughtException', err => {});
    } catch (e) {
        process.exit(1);
    }
})();
`;

var tDisableCache = `
/// Disable Cache
(async () => {
    try {
        /// Disable x-powered-by
        app.disable('x-powered-by');

        /// Secure Content-Type
        app.use(secureContentType);

        /// block SEO
        app.use(blockRobots);

        /// Disable Cache
        if (Config.core.disableCache) app.use(noCache);

        /// Allow Origin Access
        if (Config.core.accessControlAllowOrigin) app.use(<any>accessControlAllowOrigin);
    } catch (e) {
        process.exit(1);
    }
})();
`;

var tLoadRouter = `
/// Load Router
(async () => {
    try {
        var actions = routerLoader(app, \`\${__dirname}/../workspace/cgi-bin\`, Config.core.cgiPath);
        Log.Info('API Loaded', \`Totally \${Action.count(actions)} APIs.\`);
    } catch (e) {
        process.exit(1);
    }
})();
`;

var tRunMongoDB = `
/// Run MongoDB
(async () => {
    try {
        let db = await sharedMongoDB();
        // await db.createCollection("_SCHEMA");

        let stream = db.collection("_User").watch()

        stream.on('change', (change) => {});
        stream.on('error', (e) => {
            console.log(e.message);
            process.exit(1);
        });
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
})();
`;

var tRunParseServer = `
/// Run Parse Server
(async () => {
    if (!Config.mongodb.enable) return null;

    try {
        let myServerUrl = !Config.core.httpDisabled ? \`http://localhost:\${Config.core.port}\` : \`https://localhost:\${Config.core.httpsPort}\`;

        /// run parse server ////
        let serverURL = !Config.core.httpDisabled ? \`\${myServerUrl}\${Config.parseServer.serverPath}\` : \`\${myServerUrl}\${Config.parseServer.serverPath}\`;
        let databaseURI = mongoDBUrl();

        var ParseServer = new parse.ParseServer({
            //databaseURI,
            databaseAdapter: new InMemoriableMongoDBAdapter({uri: databaseURI, mongoOptions: {
                useNewUrlParser: true, 
                poolSize: 100,
                useUnifiedTopology: true,
            }}),
            filesAdapter: new GridStoreAdapter(databaseURI),
            appId: Config.parseServer.appId,
            masterKey: Config.parseServer.masterKey,
            fileKey: Config.parseServer.fileKey,
            enableSingleSchemaCache: true,
            serverURL,
            sessionLength: Config.core.sessionExpireSeconds,
            silent: true,
        })

        app.use(Config.parseServer.serverPath, ParseServer);
    } catch (e) {
        process.exit(1);
    }
})();
`;

var tRunWeb = `
/// Run Web
(async () => {
    try {
        let webPath = \`\${__dirname}/../workspace/custom/web\`;
        deployWeb(webPath, app);
    } catch (e) {
        process.exit(1);
    }
})();
`;

var tFinalizeError = `
/// Finalize Error
import { Errors } from 'core/errors.gen';

(async () => {
    try {
        app.use( (reason, req, res, next) => {
            if (reason instanceof Errors) {
                reason.resolve(res);
            } else {
                Errors.throw(Errors.Custom, [reason.toString()]).resolve(res);
            }
        });
    } catch (e) {
        process.exit(1);
    }
})();
`;

var tRunServer = `
/// Run Server
(async () => {
    try {
        let packinfo = require(\`\${__dirname}/../package.json\`);

        let jobHttp = () => {
            if (!Config.core.enable || Config.core.httpDisabled) return null;

            return new Promise(async (resolve, reject) => {
                try {
                    let http = require('http');

                    let httpServer = http.createServer(app);
                    httpServer.wsServer = expressWsRoutes.createWebSocketServer(httpServer, app, {});
                    httpServer.listen(Config.core.port, async () => {
                        Log.Info(packinfo.config.displayname, \`running at port \${Config.core.port}. (http)\`);
                        resolve();
                    });
                } catch (e) {
                    reject(e);
                }
            }).catch((e) => {
                throw e;
            });
        }

        let jobHttps = () => {
            if (!Config.core.enable || !Config.core.httpsEnabled) return null;
            
            return new Promise(async (resolve, reject) => {
                try {
                    let https = require('https');

                    let key = fs.readFileSync(\`\${__dirname}/../workspace/custom/certificates/mykey.pem\`);
                    let cert = fs.readFileSync(\`\${__dirname}/../workspace/custom/certificates/mycert.pem\`);

                    let httpsServer = https.createServer({key, cert}, app);
                    httpsServer.wsServer = expressWsRoutes.createWebSocketServer(httpsServer, app, {});
                    httpsServer.listen(Config.core.httpsPort, async () => {
                        Log.Info(packinfo.config.displayname, \`running at port \${Config.core.httpsPort}. (https)\`);
                        resolve();
                    });
                } catch (e) {
                    reject(e);
                }
            }).catch((e) => {
                throw e;
            });
        }

        await Promise.all([jobHttp(), jobHttps()]);
        makeServerReady();
    } catch (e) {
        process.exit(1);
    }
})();

export { app }
`;

function main(): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    tmpstr.push(tHeader.replace(/^[\r\n]+/, ''));
    /////////////////////////////////////////////

    /// debug track /////////////////////////////
    tmpstr.push(tDebugStack);
    /////////////////////////////////////////////

    /// disable cache ///////////////////////////
    tmpstr.push(tDisableCache);
    /////////////////////////////////////////////

    /// load router /////////////////////////////
    tmpstr.push(tLoadRouter);
    /////////////////////////////////////////////

    /// run mongodb /////////////////////////////
    tmpstr.push(tRunMongoDB);
    /////////////////////////////////////////////

    /// run parse server ////////////////////////
    tmpstr.push(tRunParseServer);
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

shellWriter2(genFilePath, main(), () => { Log.Info("Code Generator", "Server file updated!"); });

