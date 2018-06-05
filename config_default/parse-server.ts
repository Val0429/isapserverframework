var config: Config = {
    appId: "APPLICATIONKEY",
    masterKey: "MASTERKEY",
    fileKey: "FILEKEY",
    serverPath: "/parse",
};
export default config;

export interface Config {
    appId: string;
    masterKey: string;
    fileKey: string;
    /**
     * Parse url exposed by server. ex: /parse
     */
    serverPath: string;
}
