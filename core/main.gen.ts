"use strict";

import './../shells/events.shell';

import * as express from 'express';
import { expressWsRoutes } from './../helpers/middlewares/express-ws-routes';
import * as fs from 'fs';
import { noCache } from './../helpers/middlewares/no-cache';
import { routerLoader } from './../helpers/routers/router-loader';
import * as parse from 'parse-server';
import * as ParseDashboard from 'parse-dashboard';
import { configLoader } from './../helpers/config/config-helper';

import { Config } from './../core/config.gen';

let app: express.Application = expressWsRoutes();


/// (async () => {
///  await configLoader();


/// Disable Cache
if (Config.core.disableCache) app.use(noCache);


/// Load Routers!
routerLoader(app, `${__dirname}/../workspace/cgi-bin`);


/// run parse server ////
var ParseServer = new parse.ParseServer({
    databaseURI: `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}/${Config.parseServer.collection}`,
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


app.listen(Config.core.port, () => {
    console.log(`Server running at port ${Config.core.port}.`);
});


/// })();

export {
  app
}
