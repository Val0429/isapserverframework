import * as express from 'express';

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';

import * as bodyParser from 'body-parser';

let router: Router = express.Router();
router.use(bodyParser.json());

interface Input {
    account: string;
    password: string;
}

router.all('*', (req: Request, res: Response) => {
    var input: Input = (<any>req).body;
    console.log(input);
    res.end("123");
});

export default router;