import * as express from 'express';
import * as expressWs from 'express-ws';
import * as bodyParser from 'body-parser';
import { Subscription } from 'rxjs';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';

import * as Parse from 'parse/node';
import { FaceItem, PFace } from './../interfaces/FaceItem';

let router: Router = express.Router();
// router.use(bodyParser.text());

var PromiseSend = (ws, data, interval): Promise<void> => {
    return new Promise<void>((resolve) => {
        // console.log('get called?');
        //ws.send(data, null, resolve);
        ws.send(data, null, () =>
            setTimeout(() => resolve(), interval)
        );
    });
}

(<any>router).ws('*', (ws, req: Request) => {
    var query = new Parse.Query(PFace);
    query.descending("createdAt");
    query.limit(128);
    query.find({
        success: async (faces) => {
            for (var i=faces.length-1; i>=0; --i) {
                await PromiseSend(ws, JSON.stringify(faces[i].item), 2000/faces.length);
                //ws.send(JSON.stringify(faces[i].item));
            }
            setTimeout(() => ws.close(), 1000);
        },
        error: () => ws.close()
    })
});

export default router;