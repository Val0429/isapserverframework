/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as bodyParser from 'body-parser';
import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';

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