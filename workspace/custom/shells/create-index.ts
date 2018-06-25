import { waitServerReady } from './../../../core/pending-tasks';
import { Config } from './../../../core/config.gen';
import { RoleList } from './../../../core/userRoles.gen';
import { createIndex } from './../../../helpers/parse-server/parse-helper';

waitServerReady(async () => {

    /// indexes ////////////////
    /// Kiosk
    createIndex("_User", "kioskUniqueID",
        { "data.kioskId": 1 },
        { unique: true, partialFilterExpression: { "data.kioskId": { $exists: true } } }
    );
    /// Floors
    createIndex("Floors", "floorsUniqueFloor",
        { "floor": 1 },
        { unique: true }
    );
    ////////////////////////////

    /// default ////////////////
    /// Create default roles
    let role = await new Parse.Query(Parse.Role)
        .first();
    if (!role) {
        for(var key in RoleList) {
            var name = RoleList[key];
            var roleACL = new Parse.ACL();
            roleACL.setPublicReadAccess(true);
            role = new Parse.Role(name, roleACL);
            await role.save();
        }
        console.log("Default Role created.");
    }

    /// Create default users
    let user = await new Parse.Query(Parse.User)
        .first();
    if (!user) {
        user = new Parse.User();
        await user.save({
            username: "Admin",
            password: "123456",
        });
        /// Add <Administrator> and <SystemAdministrator> as default
        var roles = [];
        for (name of [RoleList.Administrator, RoleList.SystemAdministrator]) {
            role = await new Parse.Query(Parse.Role)
                .equalTo("name", name)
                .first();
            role.getUsers().add(user);
            await role.save(null, { useMasterKey: true });
            roles.push(role);
        }
        user.set("roles", roles);
        await user.save(null, { useMasterKey: true });
        console.log("Default User created.");
    }
    ////////////////////////////

});
