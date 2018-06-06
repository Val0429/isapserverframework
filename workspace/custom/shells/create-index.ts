import { waitServerReady } from './../../../core/pending-tasks';
import { MongoClient } from 'mongodb';
import { Config } from './../../../core/config.gen';
import { RoleList } from './../../../core/userRoles.gen';

waitServerReady(async () => {
    let { ip, port, collection } = Config.mongodb;
    const url = `mongodb://${ip}:${port}`;

    let client = await MongoClient.connect(url);
    let db = client.db(collection);

    /// indexes ////////////////
    /// Session
    var instance = db.collection('_Session');
    var name = "expiresTTL";
    if (!(await instance.indexExists(name))) {
        console.log(`Indexing <_Session>...`);
        instance.createIndex({
            expiresAt: -1
        }, {expireAfterSeconds: 0, background: true, name});
    }
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
        for (name of [RoleList.Administrator, RoleList.SystemAdministrator]) {
            role = await new Parse.Query(Parse.Role)
                .equalTo("name", name)
                .first();
            role.getUsers().add(user);
            await role.save(null, { useMasterKey: true });
        }
        console.log("Default User created.");
    }
    ////////////////////////////

});

