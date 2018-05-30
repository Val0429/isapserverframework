var config: Config = {
    port: 8080,
    disableCache: true,
    keyOfSessionId: "sessionId",
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
}