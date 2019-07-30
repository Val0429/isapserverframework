/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { makeReadyPromise } from 'helpers/utility/task-helper';

var {
    makeSubjectReady: makeServerReady,
    waitSubjectReady: serverReady,
} = makeReadyPromise();

export { makeServerReady, serverReady }

