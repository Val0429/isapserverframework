var config: Config = {
    ip: "localhost",
    port: 27017,
};
export default config;

export interface Config {
    ip: string;
    port: number;
}