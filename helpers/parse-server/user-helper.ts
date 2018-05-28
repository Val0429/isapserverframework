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
        role: Parse.Role;
    }
    export async function login(options: InputLogin): Promise<OutputLogin | Errors> {
        var user: Parse.User, role: Parse.Role, sessionId: string;
        
        try {
            user = await Parse.User.logIn(options.username, options.password);
            
            /// Success
            sessionId = user.getSessionToken();

            /// Get Role
            role = await new Parse.Query(Parse.Role)
                .equalTo("users", user)
                .first();

        } catch(reason) {
            console.log('failed', reason);
            return Errors.throw(Errors.RequestFailed);
        }
        
        return { sessionId, user, role };
    }
    //////////////////////////////////////////////////////////////////////

}
