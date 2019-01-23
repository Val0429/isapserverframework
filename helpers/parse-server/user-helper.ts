import { Errors } from 'core/errors.gen';
import { RoleList } from 'core/userRoles.gen';
import { getEnumKey } from 'helpers/utility/get-enum-key';
import { Config } from 'core/config.gen';
import { sharedMongoDB } from './parse-helper';
import { ObjectID } from 'mongodb';

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
            /// fetch all roles
            await Promise.all(user.get("roles").map( r => r.fetch() ) );
            
            /// Success
            sessionId = user.getSessionToken();

        } catch(reason) {
            throw Errors.throw(Errors.LoginFailed);
        }
        
        return { sessionId, user };
    }
    //////////////////////////////////////////////////////////////////////

    /// session //////////////////////////////////////////////////////////
    export async function extendSessionExpires(id: string) {
        if (Config.core.sessionExpireSeconds > 0) {
            let db = await sharedMongoDB();
            var instance = db.collection("_Session");
            instance.updateOne({_id: id }, { $set: {expiresAt: new Date(new Date().valueOf()+Config.core.sessionExpireSeconds*1000) } } );
        }
    }
    //////////////////////////////////////////////////////////////////////

    export function transformHumanRoles(roles: Parse.Role | Parse.Role[]) {
        if (Array.isArray(roles)) {
            return roles.map( (value) => transformHumanRoles(value) );
        }
        return { name: transformHumanRoleName(roles.get("name")) };
    }

    export function transformHumanRoleName(roleName: string) {
        return getEnumKey(RoleList, roleName);
    }

    export var ruleUserRole = {
        roles: {
            users: null, roles: null, name: UserHelper.transformHumanRoleName
        }
    }
}
