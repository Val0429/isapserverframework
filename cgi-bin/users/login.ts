import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList,
    Error,
    bodyParserJson
} from './../../core/cgi-package';


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

let router: Router =
    express.Router()
    .use(bodyParserJson)
    .post('*', async (req: Request, res: Response) => {

        var query: Input = req.body;

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



// interface Config {
//     /**
//      * Is this action require login?
//      * Default = true.
//      */
//     loginRequired?: boolean;

//     /**
//      * Is this action limit to specific role?
//      * Default = none.
//      */
//     permission?: RoleList[];
// }

// /// required param check
// var tt: Config = {
//     loginRequired: true,
//     permission: [RoleList.Administrator, RoleList.Tenant]
// }

// class Action<T, U> {
//     config: Config;

//     constructor(config: Config) {
//         this.config = config;
//     }

//     funcAll: ActionCallback<T, U>;
//     all(callback: ActionCallback<T, U>): Action<T, U> { this.funcAll = callback; return this; }

//     funcGet: ActionCallback<T, U>;
//     get(callback: ActionCallback<T, U>): Action<T, U> { this.funcGet = callback; return this; }

//     funcPost: ActionCallback<T, U>;
//     post(callback: ActionCallback<T, U>): Action<T, U> { this.funcPost = callback; return this; }

//     funcPut: ActionCallback<T, U>;
//     put(callback: ActionCallback<T, U>): Action<T, U> { this.funcPut = callback; return this; }

//     funcDelete: ActionCallback<T, U>;
//     delete(callback: ActionCallback<T, U>): Action<T, U> { this.funcDelete = callback; return this; }
// }

// interface ActionCallback<T, U> {
//     (data: ActionParam<T>): U | Error;
// }

// interface ActionParam<T> {
//     user: Parse.User;
//     role: IRole;
//     params: T;

//     ws: WebSocket;
//     request: Request;
//     response: Response;
// }

// new Action<Input, Output>({
//     loginRequired: false
// })
// .post((data) => {
//     return {
//         a: 123
//     }
// });
