var config: Config = {
    server: {
        port: 8080,
        disableCache: true,
        keyOfSessionId: "sessionId",
    },

    mongodb: {
        ip: "localhost",
        port: 27017,
    },

    parseServer: {
        collection: "FRS",
        appId: "APPLICATIONKEY",
        masterKey: "MASTERKEY",
        fileKey: "FILEKEY",
        serverPath: "/parse",
    },

    parseDashboard: {
        enable: true,
        serverPath: "/dashboard",
        appName: "Val App",
    }
}
export { config };

export interface ServerConfig {
    port: number;
    disableCache: boolean;
    keyOfSessionId: string;
}

export interface MongoDBConfig {
    ip: string;
    port: number;
}

export interface ParseServerConfig {
    /**
     * Database / Collection used for app.
     */
    collection: string;
    appId: string;
    masterKey: string;
    fileKey: string;
    /**
     * Parse url exposed by server. ex: /parse
     */
    serverPath: string;
}

export interface ParseDashboard {
    enable: boolean;
    /**
     * Parse dashboard url exposed by server. ex: /dashboard
     */
    serverPath: string;
    appName: string;
}

export interface Config {
    server: ServerConfig;

    mongodb: MongoDBConfig;

    parseServer: ParseServerConfig;

    parseDashboard: ParseDashboard;
}