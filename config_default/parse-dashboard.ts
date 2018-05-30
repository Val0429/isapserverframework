var config: Config = {
    enable: true,
    serverPath: "/dashboard",
    appName: "Val App",
};
export default config;

export interface Config {
    enable: boolean;
    /**
     * Parse dashboard url exposed by server. ex: /dashboard
     */
    serverPath: string;
    appName: string;
}