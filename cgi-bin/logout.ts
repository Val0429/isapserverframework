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

router.post('*', async (req: Request, res: Response) => {
    var query: Input = (<any>req).body;

    /// Input not match: 401
    if (!query.sessionId) res.status(401).end("<sessionId> required.");

    /// Try get session user
    try {
        var o: Parse.Session = await new Parse.Query("_Session")
            .descending("createdAt")
            .first({sessionToken: query.sessionId}) as Parse.Session;

        /// Session not match
        if (!o || o.getSessionToken() !== query.sessionId) throw "";

        /// Success
        /// Perform Logout: 200
        o.destroy({ sessionToken: query.sessionId });
        res.end();

    } catch(reason) {
        /// No session exists: 404
        res.status(404).end("<sessionId> not exists.");

    }
});

export default router;