import coreConfig, { Config as coreConfigType } from './../workspace/config/default/core';
import mongodbConfig, { Config as mongodbConfigType } from './../workspace/config/default/mongodb';
import parseDashboardConfig, { Config as parseDashboardConfigType } from './../workspace/config/default/parse-dashboard';
import parseServerConfig, { Config as parseServerConfigType } from './../workspace/config/default/parse-server';
import cmsConfig, { Config as cmsConfigType } from './../workspace/config/custom/cms';
import evisConfig, { Config as evisConfigType } from './../workspace/config/custom/evis';
import frsConfig, { Config as frsConfigType } from './../workspace/config/custom/frs';
import ftsConfig, { Config as ftsConfigType } from './../workspace/config/custom/fts';


interface IConfig {
    core: coreConfigType;
    mongodb: mongodbConfigType;
    parseDashboard: parseDashboardConfigType;
    parseServer: parseServerConfigType;
    cms: cmsConfigType;
    evis: evisConfigType;
    frs: frsConfigType;
    fts: ftsConfigType;
}
export { IConfig };


var Config: IConfig = {
    core: <any>coreConfig,
    mongodb: <any>mongodbConfig,
    parseDashboard: <any>parseDashboardConfig,
    parseServer: <any>parseServerConfig,
    cms: <any>cmsConfig,
    evis: <any>evisConfig,
    frs: <any>frsConfig,
    fts: <any>ftsConfig,
}

export { Config };
