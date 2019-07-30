/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

var config: Config = {
    enable: true,
    ip: "localhost",
    port: 27017,
    collection: "VMS",   
};
export default config;

interface IReplicaUnit {
    ip: string;
    port: string;
    account?: string;
    password?: string;
}
interface IReplica {
    /// replica set name, ex: rs0
    name: string;
    servers: IReplicaUnit[];
}

export interface Config {
    enable: boolean;
    /**
     * Single machine config
     */
    ip?: string;
    port?: number;
    account?: string;
    password?: string;
    /**
     * Replica config. If `replica` is provided, will ignore single machine config.
     */
    replica?: IReplica;
    /**
     * Database / Collection used for app.
     */
    collection: string;
}

// const mergeDBConfig = (config: Config) => {
//     let { collection, replica } = config;
//     const basic = (config) => `${!config.account?'':`${config.account}:${config.password}@`}${config.ip}:${config.port}`;
//     if (!replica)
//         return `mongodb://${basic(config)}/${collection}`;
//     else
//         return `mongodb://${replica.servers.map(server => basic(server)).join(",")}/${collection}?replicaSet=${replica.name}`;
// }
