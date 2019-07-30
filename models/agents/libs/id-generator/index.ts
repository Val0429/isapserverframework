/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as shortid from 'shortid';

export function idGenerate() {
    return shortid.generate();
}