/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { serverReady } from './pending-tasks';
import { Config } from './config.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';

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

})();
