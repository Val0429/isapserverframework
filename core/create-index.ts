import { waitServerReady } from './pending-tasks';
import { Config } from './config.gen';
import { RoleList } from './userRoles.gen';
import { createIndex } from './../helpers/parse-server/parse-helper';

waitServerReady(async () => {

    /// indexes ////////////////
    /// Session
    createIndex("_Session", "expiresTTL",
        { expiresAt: -1 },
        { expireAfterSeconds: 0 }
    );
    ////////////////////////////
});

