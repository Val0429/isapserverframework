var config: Config = {
    ip: "localhost",
    port: 27017,
    collection: "VMS",   
};
export default config;

export interface Config {
    ip: string;
    port: number;
    /**
     * Database / Collection used for app.
     */
    collection: string;
}