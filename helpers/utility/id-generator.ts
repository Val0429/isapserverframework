/*
 * Created on Tue Dec 15 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import { nanoid } from 'nanoid';

export function idGenerate(len: number = 10) {
    return nanoid(len);
}