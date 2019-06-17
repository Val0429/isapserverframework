var config: Config = {
    enable: false,
    comPort: "COM8",
    timeout: 10000
}
export default config;

export interface Config {
    enable: boolean;
    comPort: string;
    timeout: number;
}
