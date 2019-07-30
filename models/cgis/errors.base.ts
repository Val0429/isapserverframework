/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

/**
 * Cgi Action<> support return Errors. including ErrorObject.
 */
export interface ErrorObject {
    statusCode: number;
    message: string;
}
