var errors: Config[] = [
    ["LoginRequired", 401, "This action requires login."],
    ["ParametersRequired", 401, "Parameters required: {0}"],
    
    ["RequestFailed", 404, "Request failed."],
    ["PermissionDenined", 404, "Permission denined."],
    ["SessionNotExists", 404, "Session not exists."],
];

export default errors;

export type Config = [string, number, string];
