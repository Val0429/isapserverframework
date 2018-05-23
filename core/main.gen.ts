/// <reference path="./../typings/index.d.ts" />
"use strict";

import './../shells/events.shell';

import * as express from 'express';
import { expressWsRoutes } from './../helpers/middlewares/express-ws-routes';
import * as fs from 'fs';
import { config } from './../config/core/core.define';

let app: express.Application = expressWsRoutes();


/// Disable Cache
import { noCache } from './../helpers/middlewares/no-cache';
if (config.server.disableCache) app.use(noCache);


/// Load Routers!
import { routerLoader } from './../helpers/routers/router-loader';
routerLoader(app, `${__dirname}/../workspace/cgi-bin`);


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
        "serverURL": `http://localhost:${config.server.port}${config.parseServer.serverPath}`,
        "appId": config.parseServer.appId,
        "masterKey": config.parseServer.masterKey,
        "appName": config.parseDashboard.appName
      }
    ]
  });
  app.use(config.parseDashboard.serverPath, Dashboard);
}
////////////////////////////


app.listen(config.server.port, () => {
    console.log(`Server running at port ${config.server.port}.`);
});

export {
  app
}

// import * as https from 'https';
// import { readFileSync } from 'fs';
// const options = {
//   key: readFileSync('./config/certificates/mykey.key'),
//   cert: readFileSync('./config/certificates/mycert.crt')
// }
// https.createServer(options, app).listen(8081, () => {
//   console.log('https server listen on 8081.');
// });