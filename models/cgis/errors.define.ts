/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

var errors: Config[] = [
    ["LoginRequired", 401, "This action requires login."],
    ["ParametersRequired", 400, "Parameters required: {0}"],
    
    ["ParametersInvalid", 400, "Parameters invalid: {0}"],
    ["LoginFailed", 401, "Login failed."],
    ["PermissionDenied", 403, "Permission denied."],
    ["SessionNotExists", 401, "Session not exists."],

    /**
     * Leave for previous use.
     */
    ["CustomAlreadyExists", 400, "{0}"],
    ["CustomNotExists", 400, "{0}"],
    ["CustomInvalid", 400, "{0}"],

    ["Custom", 500, "{0}"],

    /**
     * wrong Parameters
     * lack Parameters
     * duplicate entry
     */
    ["CustomBadRequest", 400, "{0}"],
    /**
     * no token
     * expired token
     * unauthorized role
     * token not found
     * multi login
     */
    ["CustomUnauthorized", 401, "{0}"],
    /**
     * wrong address
     */
    ["CustomNotFound", 404, "{0}"],
];

export default errors;

export type Config = [string, number, string];
