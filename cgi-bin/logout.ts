import * as express from 'express';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';

import * as bodyParser from 'body-parser';
import * as Parse from 'parse/node';

let router: Router = express.Router();
router.use(bodyParser.json());

interface Input {
    sessionId: string;
}

router.post('*', (req: Request, res: Response) => {
    var query: Input = (<any>req).body;

    /// Input not match: 401
    if (!query.sessionId) res.status(401).end("<sessionId> required.");

    /// Try get session user
    new Parse.Query("_Session")
        .find({sessionToken: query.sessionId})
        .then( (o: Parse.Session[]) => {
            /// Perform Logout: 200
            o[0].destroy({ sessionToken: query.sessionId });
            res.end();

        }, (reason) => {
            /// No session exists
            res.status(404).end("<sessionId> not exists.");
        });
});

export default router;