import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from './../../../core/cgi-package';


export interface Input {
    sessionId: string;
}

export default new Action<Input>({
    loginRequired: true
})
.ws(async (data) => {
    // /// Check param requirement
    // console.log('is it here?', data.parameters);

    // var socket = data.socket;
    // socket.on("message", (message) => {
    //     console.log('gotgot', message);
    //     socket.send(message);
    // });
});
