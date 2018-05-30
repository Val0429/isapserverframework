import coreConfig, { Config as coreConfigType } from './../workspace/config/default/core';
import mongodbConfig, { Config as mongodbConfigType } from './../workspace/config/default/mongodb';
import parseDashboardConfig, { Config as parseDashboardConfigType } from './../workspace/config/default/parse-dashboard';
import parseServerConfig, { Config as parseServerConfigType } from './../workspace/config/default/parse-server';
import frsConfig, { Config as frsConfigType } from './../workspace/config/custom/frs';


interface Config {
core: coreConfigType;
mongodb: mongodbConfigType;
parseDashboard: parseDashboardConfigType;
parseServer: parseServerConfigType;
frs: frsConfigType;
}


var Config: Config = {
core: <any>coreConfig,
mongodb: <any>mongodbConfig,
parseDashboard: <any>parseDashboardConfig,
parseServer: <any>parseServerConfig,
frs: <any>frsConfig,
}

export { Config };
