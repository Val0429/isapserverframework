/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

var config: Config = {
    enable: true,
    host: "mail.isapsolution.com",
    port: 25,
    ssl: false,
    email: "services@isapsolution.com",
    password: "Az123456",
}
export default config;

export interface Config {
    enable: boolean;
    host: string;
    port: number;
    ssl: boolean;
    name?: string;
    email: string;
    password: string;
}
