/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

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
