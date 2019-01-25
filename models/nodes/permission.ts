import { ParseObject } from "helpers/parse-server/parse-helper";

export interface IPermission<PermissionList, PermissionOf, Role1, Role2, Role3, Role4> {
    of: PermissionOf;

    /// abcd pick one
    a: Role1;
    b: Role2;
    c: Role3;
    d: Role4;

    access: PermissionList;
}

type ParseObjectClass = { new(): ParseObject<any> };

export namespace Permission {
    export function Of<
        PermissionOf extends ParseObjectClass,
        T = PermissionOf extends { new(): infer A } ? A : never,
    >(permissionOf: PermissionOf) {
        return {
            With: <PermissionList>() => {
                return {
                    On:
                    <
                        Role1 extends ParseObjectClass,
                        Role2 extends ParseObjectClass = never,
                        Role3 extends ParseObjectClass = never,
                        Role4 extends ParseObjectClass = never,
                        U = Role1 extends { new(): infer A } ? A : never,
                        V = Role2 extends { new(): infer A } ? A : never,
                        K = Role3 extends { new(): infer A } ? A : never,
                        C = Role4 extends { new(): infer A } ? A : never,
                    >(role1: Role1, role2?: Role2, role3?: Role3, role4?: Role4) => {
                        return class extends ParseObject<IPermission<PermissionList, T, U, V, K, C>> {
                            
                        }
                    }
                }
            }
        }
    }
}

