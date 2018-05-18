import * as bodyParser from 'body-parser';
import { Request } from 'express/lib/request';

declare module 'express/lib/request' {
    interface Request {
        body: any;
    }
}

var bodyParserJson = bodyParser.json();
var bodyParserText = bodyParser.text();

export {
    bodyParser,
    bodyParserJson,
    bodyParserText
}