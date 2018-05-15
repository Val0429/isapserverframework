import * as express from 'express';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';

import * as bodyParser from 'body-parser';

import { IRole } from '../interfaces/core';

let router: Router = express.Router();
router.use(bodyParser.json());

interface Input {
    username: string;
    password: string;
}

interface Output {
    sessionId: string;
    serverTime: number;
    role: IRole;
}

router.get('*', async (req: Request, res: Response) => {
    var query: Input = <any>req.query;

    /// Input not match: 401
    if (!query.username) res.status(401).end("<username> is required.");

    /// Try login
    var user = await Parse.User.logIn(query.username, query.password)
        .then(
            async (user) => {
                var role = await new Parse.Query(Parse.Role)
                                    .equalTo("users", user)
                                    .first();

                /// Success
                res.end(JSON.stringify(
                    <Output>{
                        sessionId: user.getSessionToken(),
                        serverTime: new Date().valueOf(),
                        role: { name: role.get("name") }
                    }
                ));
            },
            async (reason) => {
                /// Failed: 401
                res.status(401).end("Login failed.");
            }
        );
});

export default router;