import * as express from 'express';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';

import * as bodyParser from 'body-parser';

import { IRole, IUser } from '../models/core';

let router: Router = express.Router();
router.use(bodyParser.json());

interface Input {
    username: string;
    password: string;
}

interface Output {
    sessionId: string;
    serverTime: number;
    user: IUser;
    role: IRole;
}

router.get('*', async (req: Request, res: Response) => {
    var query: Input = <any>req.query;

    /// Input not match: 401
    if (!query.username) res.status(401).end("<username> is required.");

    /// Try login
    try {
        var user: Parse.User = await Parse.User.logIn(query.username, query.password);
        /// Success
        var role = await new Parse.Query(Parse.Role)
                                  .equalTo("users", user)
                                  .first();

        res.end(JSON.stringify(
            <Output>{
                sessionId: user.getSessionToken(),
                serverTime: new Date().valueOf(),
                role: { name: role.get("name") },
                user: user.attributes
            }
        ));

    } catch(reason) {
        /// Failed: 401
        res.status(401).end("Login failed.");

    }

});

export default router;