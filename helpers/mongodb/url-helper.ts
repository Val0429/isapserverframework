import { Config } from 'core/config.gen';
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
    let { collection, replica, authSource } = config;
    let useAuth: boolean = !!config.account && !!config.password;
    let connString: string = `mongodb://${basic(config, useAuth)}/${collection}`;
    if (!!replica) {
        let replicaString: string = replica.servers.map((server) => basic(server)).join(',');
        connString = `mongodb://${basic(config, useAuth)},${replicaString}/${collection}?replicaSet=${replica.name}`;
    }
    if (useAuth) {
        let source: string = !authSource ? collection : authSource;
        connString += `${/\?/.test(connString) ? '&' : '?'}authSource=${source}`;
    }
    return connString;
}
function basic(config, useAuth = false) {
    let ip = config.ip;
    let port = config.port;
    if (useAuth) {
        let account = encodeURIComponent(config.account);
        let password = encodeURIComponent(config.password);
        return `${account}:${password}@${ip}:${port}`;
    }
    return `${ip}:${port}`;
}