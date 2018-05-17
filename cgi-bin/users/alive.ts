import * as express from 'express';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';

import { bodyParser } from './../../helpers/middlewares/body-parser';
import * as Parse from 'parse/node';

let router: Router = express.Router();
router.use(bodyParser.json());

interface Input {
    sessionId: string;
}

(<any>router).ws('*', (ws, req: Request) => {
    console.log('websocket created');

    ws.on('close', () => {
        console.log('websocket closed');
    });
});

export default router;