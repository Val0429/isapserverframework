/// <reference path="./../typings/index.d.ts" />
"use strict";

import './../shells/events.shell';

import * as express from 'express';
import * as expressWs from 'express-ws';
import * as fs from 'fs';
import config from './../config/core/core.define';

let app: express.Server = express();
/// Enable WebSocket support
let wsapp = expressWs(app);

/// Disable Cache
import noCacheModule from './../helpers/middlewares/no-cache';
if (config.server.disableCache) app.use(noCacheModule);

/// Load Routers!
import RouterLoader from './../helpers/RouterLoader';
RouterLoader(app, `${__dirname}/../cgi-bin`);

/// run parse server ////
import * as parse from 'parse-server';
var ParseServer = new parse.ParseServer({
    databaseURI: `mongodb://${config.mongodb.ip}:${config.mongodb.port}/${config.parseServer.collection}`,
    appId: config.parseServer.appId,
    masterKey: config.parseServer.masterKey,
    fileKey: config.parseServer.fileKey,
    serverURL: `http://localhost:${config.server.port}${config.parseServer.serverPath}`,
});
app.use(config.parseServer.serverPath, ParseServer);
/////////////////////////

/// run parse dashboard ////
import * as ParseDashboard from 'parse-dashboard';
if (config.parseDashboard.enable) {
  var Dashboard = new ParseDashboard({
    "apps": [
      {
        "serverURL": `http://localhost:${config.server.port}${config.parseDashboard.serverPath}`,
        "appId": config.parseServer.appId,
        "masterKey": config.parseServer.masterKey,
        "appName": config.parseDashboard.appName
      }
    ]
  });
  app.use('/dashboard', Dashboard);
}
////////////////////////////

app.listen(config.server.port, () => {
    console.log(`Server running at port ${config.server.port}.`);
});

export {
  app
}