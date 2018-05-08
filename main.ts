/// <reference path="typings/index.d.ts" />
"use strict";

import * as express from 'express';
import * as expressWs from 'express-ws';
import * as fs from 'fs';
import cfg from './config/config';

let app: express.Server = express();
let wsapp = expressWs(app);

//import router_listen from './routers/listen';
var router_listen = require('./routers/'+'listen').default;
import router_search from './routers/search';
import router_latestImages from './routers/latestImages';

/// No Cache
import noCacheModule from './middlewares/no-cache';
app.use(noCacheModule);

/// Load Routers!
import RouterLoader from './helpers/RouterLoader';
RouterLoader(app, `${__dirname}/routers`);

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

app.listen(cfg.serverport, () => {
    console.log(`Server listening on port ${cfg.port}.`);
});
