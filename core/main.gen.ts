"use strict";

import './../shells/events.shell';

import * as express from 'express';
import { expressWsRoutes } from './../helpers/middlewares/express-ws-routes';
import * as fs from 'fs';
import { noCache } from './../helpers/middlewares/no-cache';
import { accessControlAllowOrigin } from './../helpers/middlewares/access-control-allow-origin';
import { routerLoader } from './../helpers/routers/router-loader';
import { typesGenerator } from './../helpers/types/types-generator';
import { makeServerReady, waitServerReady } from './../core/pending-tasks';
import * as parse from 'parse-server';
import * as ParseDashboard from 'parse-dashboard';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';

import { Config } from './../core/config.gen';

let app: express.Application = expressWsRoutes();


/// Disable Cache
if (Config.core.disableCache) app.use(noCache);


/// Allow Origin Access
if (Config.core.accessControlAllowOrigin) app.use(<any>accessControlAllowOrigin);


/// Load Routers!
var actions = routerLoader(app, `${__dirname}/../workspace/cgi-bin`, Config.core.cgiPath);
//typesGenerator(actions);


/// run parse server ////
var ParseServer = new parse.ParseServer({
    databaseURI: `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}/${Config.mongodb.collection}`,
    appId: Config.parseServer.appId,
    masterKey: Config.parseServer.masterKey,
    fileKey: Config.parseServer.fileKey,
    serverURL: `http://localhost:${Config.core.port}${Config.parseServer.serverPath}`,
});
app.use(Config.parseServer.serverPath, ParseServer);
/////////////////////////


/// run parse dashboard ////
if (Config.parseDashboard.enable) {
var Dashboard = new ParseDashboard({
    "apps": [
    {
        "serverURL": `http://localhost:${Config.core.port}${Config.parseServer.serverPath}`,
        "appId": Config.parseServer.appId,
        "masterKey": Config.parseServer.masterKey,
        "appName": Config.parseDashboard.appName
    }
    ]
});
app.use(Config.parseDashboard.serverPath, Dashboard);
}
////////////////////////////


app.use('/', express.static(`${__dirname}/../workspace/custom/web`));


app.listen(Config.core.port, async () => {
    console.log(`Server running at port ${Config.core.port}.`);

    /// todo: this is a workaround. create database at the beginning.
    let { ip, port, collection } = Config.mongodb;
    const url = `mongodb://${ip}:${port}/${collection}`;
    let client = await MongoClient.connect(url);
    let db = client.db(collection);
    await db.createCollection("_SCHEMA");
    ////////////////////////////////////////////////////////////////

    makeServerReady();
});

export {
  app
}
