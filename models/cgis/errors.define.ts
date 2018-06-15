var errors: Config[] = [
    ["LoginRequired", 401, "This action requires login."],
    ["ParametersRequired", 401, "Parameters required: {0}"],
    
    ["ParametersInvalid", 404, "Parameters invalid: {0}"],
    ["RequestFailed", 404, "Request failed."],
    ["PermissionDenined", 404, "Permission denined."],
    ["SessionNotExists", 404, "Session not exists."],

    ["CustomAlreadyExists", 400, "{0}"],
    ["CustomNotExists", 404, "{0}"],
    ["CustomInvalid", 404, "{0}"],
    ["Custom", 500, "{0}"],
];

export default errors;

export type Config = [string, number, string];
