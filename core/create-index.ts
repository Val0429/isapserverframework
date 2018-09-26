import { serverReady } from './pending-tasks';
import { Config } from './config.gen';
import { RoleList } from './userRoles.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';
import { autoIndex } from 'helpers/shells/auto-index';

Config.mongodb.enable &&
(async () => {

await serverReady;

/// indexes ////////////////
/// Session
createIndex("_Session", "expiresTTL",
    { expiresAt: -1 },
    { expireAfterSeconds: 0 }
);
createIndex("_Session", "createdAt",
    { createdAt: -1 }
);
////////////////////////////

/// file indexes ///////////
autoIndex("./../models/schedulers/actions");
autoIndex("./../models/schedulers/controllers");
autoIndex("./../models/schedulers/templates");
////////////////////////////

})();
