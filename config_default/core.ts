var config: Config = {
    port: 8080,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: "",
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
    accessControlAllowOrigin: boolean;
    /**
     * Sub path of cgi? ex: /api
     * default: null
     */
    cgiPath: string;
}