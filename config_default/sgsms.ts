/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

var config: Config = {
    enable: true,
    url: "https://mx.fortdigital.net/http/send-message",
    username: "test1",
    password: "test1"
}
export default config;

export interface Config {
    enable: boolean;
    url: string;
    username: string;
    password: string;
}
