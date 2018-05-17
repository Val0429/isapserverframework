import * as bodyParser from 'body-parser';
import { Request } from 'express/lib/request';

declare module 'express/lib/request' {
    interface Request {
        body: any;
    }
}

export {
    bodyParser
}