/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Semaphore } from './semaphore';

export class Mutex extends Semaphore {
    constructor() {
        super(1);
    }
}