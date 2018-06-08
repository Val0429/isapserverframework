import * as Parse from 'parse/node';
import { Errors } from './../../core/errors.gen';
import { RoleList } from './../../core/userRoles.gen';
import { getEnumKey } from './../utility/get-enum-key';

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
