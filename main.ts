/// <reference path="typings/index.d.ts" />
"use strict";

import * as express from 'express';
import * as expressWs from 'express-ws';
import * as fs from 'fs';
import cfg from './config/config';
import './models/events/definition/events.template';

let app: express.Server = express();
let wsapp = expressWs(app);

/// No Cache
import noCacheModule from './helpers/middlewares/no-cache';
app.use(noCacheModule);

/// Load Routers!
import RouterLoader from './helpers/RouterLoader';
RouterLoader(app, `${__dirname}/cgi-bin`);

/// run parse server ////
import * as parse from 'parse-server';
var ParseServer = new parse.ParseServer({
    databaseURI: `mongodb://${cfg.mongodb_ip}:${cfg.mongodb_port}/FRS`,
    appId: "APPLICATIONKEY",
    masterKey: "MASTERKEY",
    fileKey: "FILEKEY",
    serverURL: `http://localhost:${cfg.serverport}/parse`,
});
app.use('/parse', ParseServer);
/////////////////////////

/// run parse dashboard ////
import * as ParseDashboard from 'parse-dashboard';
var Dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": "http://localhost:7070/parse",
      "appId": "APPLICATIONKEY",
      "masterKey": "MASTERKEY",
      "appName": "Val App"
    }
  ]
});
app.use('/dashboard', Dashboard);
////////////////////////////

app.listen(cfg.serverport, () => {
    console.log(`Server listening on port ${cfg.port}.`);
});
