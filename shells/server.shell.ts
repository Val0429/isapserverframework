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
import { RouterLoader } from 'helpers/routers/router-loader';
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

import { PrintService } from 'helpers';

const IsDebug: boolean = process.env.NODE_ENV === 'development';

let app: express.Application = expressWsRoutes();

/**
 * Get real exception message
 * @param e 
 */
function GetRealMessage(e: any): string {
    try {
        let message: string = e instanceof Error ? e.message : typeof e === 'object' ? JSON.stringify(e) : e.toString();

        return message
    } catch (e) {
        throw e
    }
}
`;

var tProcess = `
/// Process
(async () => {
    try {
        process.on("uncaughtException", (e) => {
            PrintService.logCustomPath(GetRealMessage(e), 'process/uncaughtException', 'error');
        })
        process.on('unhandledRejection', (e) => {
            PrintService.logCustomPath(GetRealMessage(e), 'process/unhandledRejection', 'error');
        });
    } catch (e) {
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tProcess', 'error');
        process.exit(1);
    }
})();
`;

var tDebugStack = `
/// Debug Stack
(async () => {
    if (!IsDebug) return null;

    try {
        var longjohn = require('longjohn');
        longjohn.async_trace_limit = 20;
        // process.on('uncaughtException', err => {});

        PrintService.log('Enable long stack traces for node.js with configurable call trace length.', undefined, 'warning');
    } catch (e) {
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tDebugStack', 'error');
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
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tDisableCache', 'error');
        process.exit(1);
    }
})();
`;

var tLoadRouter = `
/// Load Router
(async () => {
    try {
        PrintService.log(\`Mounting Cgi Tree.\`, undefined, 'info');
        
        let paths: string[] = [];
        paths.push(\`\${__dirname}/../workspace/cgi-bin\`);

        let actions = RouterLoader(app, paths, Config.core.cgiPath);
        PrintService.log(\`Api loaded totally \${Action.count(actions)} apis.\`, undefined, 'info');
    } catch (e) {
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tLoadRouter', 'error');
        process.exit(1);
    }
})();
`;

var tRunMongoDB = `
/// Run MongoDB
(async () => {
    try {
        PrintService.log(\`MongoDB connect at \${mongoDBUrl()}.\`, undefined, 'info');
        let db = await sharedMongoDB();

        await db.createCollection("_User");

        let stream = db.collection("_User").watch()

        stream.on('change', (change) => {});
        stream.on('error', (e) => {
            PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tRunMongoDB', 'error');
            process.exit(1);
        });
    } catch (e) {
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tRunMongoDB', 'error');
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
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tRunParseServer', 'error');
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
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tRunWeb', 'error');
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
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tFinalizeError', 'error');
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
                        PrintService.log(\`Running at port \${Config.core.port}. (http)\`, undefined, 'info');
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
                        PrintService.log(\`Running at port \${Config.core.httpsPort}. (https)\`, undefined, 'info');
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
        PrintService.logCustomPath(GetRealMessage(e), 'server.shell/tRunServer', 'error');
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
    
    /// process /////////////////////////////////
    tmpstr.push(tProcess);
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

import { PrintService } from 'helpers';

shellWriter2(genFilePath, main(), () => { PrintService.log('Server file updated.', undefined, 'success'); });

