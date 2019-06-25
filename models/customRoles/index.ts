import { registerSubclass, ParseObject } from "helpers/cgi-helpers/core";
import { Permission } from "models/nodes/permission";

export interface IAPITokens {
    identifier: string;
}
@registerSubclass() export class APITokens extends ParseObject<IAPITokens> {}

export interface IAPIRoles {
    identifier: string;
}
@registerSubclass() export class APIRoles extends ParseObject<IAPIRoles> {}

export interface IAPIPermissions {
    C?: boolean;
    R?: boolean;
    U?: boolean;
    D?: boolean;
}
@registerSubclass() export class APIPermissions extends Permission.Of(APITokens).With<IAPIPermissions>().On(APIRoles) {}
