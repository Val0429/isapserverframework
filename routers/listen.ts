import * as express from 'express';
import * as expressWs from 'express-ws';
import * as bodyParser from 'body-parser';
import { Subscription } from 'rxjs';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';

import { FaceListenerSubject } from './../services/FaceListenerService';

let router: Router = express.Router();
// router.use(bodyParser.text());

(<any>router).ws('*', (ws, req: Request) => {
    console.log('websocket created');
    var subscription: Subscription = FaceListenerSubject.subscribe( (data) => {
        ws.send(JSON.stringify(data));
    });

    ws.on('close', () => {
        console.log('websocket closed');
        subscription.unsubscribe();
    });
});

export default router;