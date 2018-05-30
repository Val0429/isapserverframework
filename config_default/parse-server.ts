var config: Config = {
    collection: "FRS",
    appId: "APPLICATIONKEY",
    masterKey: "MASTERKEY",
    fileKey: "FILEKEY",
    serverPath: "/parse",
};
export default config;

export interface Config {
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
