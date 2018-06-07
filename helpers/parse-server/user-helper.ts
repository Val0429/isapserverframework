import * as Parse from 'parse/node';
import { Errors } from './../../core/errors.gen';

export namespace UserHelper {

    /// login ////////////////////////////////////////////////////////////
    export interface InputLogin {
        username: string;
        password: string;
    }
    export interface OutputLogin {
        sessionId: string;
        user: Parse.User;
    }
    /**
     * Helper that login into user, get back user / role / sessionId.
     */
    export async function login(options: InputLogin): Promise<OutputLogin> {
        var user: Parse.User, sessionId: string;
        
        try {
            user = await Parse.User.logIn(options.username, options.password);
            for (var role of user.get("roles")) await role.fetch();
            
            /// Success
            sessionId = user.getSessionToken();

        } catch(reason) {
            console.log('login failed', reason);
            throw Errors.throw(Errors.RequestFailed);
        }
        
        return { sessionId, user };
    }
    //////////////////////////////////////////////////////////////////////

}
