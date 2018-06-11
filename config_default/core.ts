var config: Config = {
    port: 8080,
    disableCache: true,
    keyOfSessionId: "sessionId",
    accessControlAllowOrigin: true,
};
export default config;

export interface Config {
    /**
     * Server port.
     */
    port: number;
    /**
     * Globally disable cache?
     */
    disableCache: boolean;
    keyOfSessionId: string;
    accessControlAllowOrigin: boolean;
}