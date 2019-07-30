import { Config } from "core/config.gen";

// const mergeDBConfig = (config) => {
//     let { collection, replica } = config;
//     const basic = (config) => \`\${!config.account?'':\`\${config.account}:\${config.password}@\`}\${config.ip}:\${config.port}\`;
//     if (!replica)
//         return \`mongodb://\${basic(config)}/\${collection}\`;
//     else
//         return \`mongodb://\${replica.servers.map(server => basic(server)).join(",")}/\${collection}?replicaSet=\${replica.name}\`;
// }

export function mongoDBUrl() {
    let config = Config.mongodb;
    let { collection, replica } = config;
    const basic = (config) => `${!config.account?'':`${config.account}:${config.password}@`}${config.ip}:${config.port}`;
    if (!replica)
        return `mongodb://${basic(config)}/${collection}`;
    else
        return `mongodb://${replica.servers.map(server => basic(server)).join(",")}/${collection}?replicaSet=${replica.name}`;
}