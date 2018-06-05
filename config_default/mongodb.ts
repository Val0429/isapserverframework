var config: Config = {
    ip: "localhost",
    port: 27017,
    collection: "FRS",   
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