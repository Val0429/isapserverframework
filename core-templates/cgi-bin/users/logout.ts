/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Events, EventLogout
} from 'core/cgi-package';


export interface Input {
    sessionId: string;
}

export default new Action<Input>({
    loginRequired: true
})
.post({inputType: "Input"}, async (data) => {
    /// Perform Logout
    data.session.destroy({ sessionToken: data.parameters.sessionId });

    var ev = new EventLogout({
        owner: data.user
    });
    await Events.save(ev);

    return "";
});
