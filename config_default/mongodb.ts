var config: Config = {
    enable: true,
    ip: "localhost",
    port: 27017,
    collection: "VMS",   
};
export default config;

export interface Config {
    enable: boolean;
    ip: string;
    port: number;
    account?: string;
    password?: string;
    /**
     * Database / Collection used for app.
     */
    collection: string;
}