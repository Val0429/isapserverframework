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
    // var socket = data.socket;
    // socket.send("I'm here. go throw");
    // throw Errors.throw(Errors.Custom, ["500 not found"]);

    // var socket = data.socket;
    // socket.send("500 not found");
    // socket.closeGracefully();

    // /// Check param requirement
    // console.log('is it here?', data.parameters);

    // var socket = data.socket;
    // socket.on("message", (message) => {
    //     console.log('gotgot', message);
    //     socket.send(message);
    // });
});
