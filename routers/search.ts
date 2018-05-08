import * as express from 'express';
import * as expressWs from 'express-ws';
import * as bodyParser from 'body-parser';
import { client as WebSocketClient } from 'websocket';
import cfg from './../config/config';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';

import { SearchParam, SearchInfo, SearchItem } from './../interfaces/SearchItem';

/// automation const ///
const ignoreLength = cfg.ignoreLength;
const UrlSearch= `ws://${cfg.ip}:${cfg.port}/search`;

let router: Router = express.Router();
// router.use(bodyParser.text());

(<any>router).ws('*', (ws, req: Request) => {
    ws.on('message', (msg: SearchParam /* of string */) => {
        /// receive search request
        var client = new WebSocketClient();
        client.on('connect', (connection) => {
            console.log('ken server connected');
            connection.sendUTF(msg);
            connection.on('message', (message) => {
                console.log(`capture face!!!: ${message.utf8Data}`);
                try {
                    ws.send(message.utf8Data);
                } catch (e) {}
            });
        });

        client.connect(UrlSearch);
    });
});

export default router;