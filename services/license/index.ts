/*
 * Created on Tue May 12 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import * as fs from 'fs';
import * as path from 'path';
import { Log } from 'helpers/utility';
const configPath: string = `${__dirname}/../../workspace/custom/license/`;

/// import native module
const isWindows = process.platform === "win32";
const licenseClass = isWindows ?
    require('./lib/windows/license_manager') :
    require('./lib/linux/license_manager')
    ;


/// license copy function
{
    const configFilePath = path.resolve(configPath, "license.xml");
    const configAssetsDir = path.resolve(configPath, "../assets");
    const configAssetsPath = path.resolve(configAssetsDir, "license.xml");
    
    /// if assets not exists, create
    if (!fs.existsSync(configAssetsDir)) fs.mkdirSync(configAssetsDir);

    /// everytime initial, copy from assets
    if (fs.existsSync(configAssetsPath)) fs.copyFileSync(configAssetsPath, configFilePath);

    /// everytime saved, copy to assets
    fs.watchFile(configFilePath, (cur, prev) => {
        /// if not exists
        if (cur.mtime.getTime() === 0) return;
        fs.copyFileSync(configFilePath, configAssetsPath);
    });
}


const license = new licenseClass.LicenseManager(configPath);

/// interfaces
export interface LicenseInfo {
    summary: { [productNO: string]: LicenseSummary };
    licenses: License[];
}

export interface LicenseSummary {
    totalCount: number;
}

export interface License {
    licenseKey: string;
    description: string;
    mac: string;
    brand: string;
    productNO: string;
    count: number;

    trial: boolean;
    registerDate: string;
    expireDate: string;
    expired: boolean;
}

interface IVerifyLicenseKey {
    key: string;
}
const VerifyLicenseKey = license.VerifyLicenseKey.bind(license);

interface IVerifyLicenseXML {
    xml: string;
}
const VerifyLicenseXML = license.VerifyLicenseXML.bind(license);

interface IAddLicense {
    xml: string;
}
const AddLicense = license.AddLicense.bind(license);
const GetLicenseXML = license.GetLicenseXML.bind(license);
const GetLicense = license.GetLicense.bind(license);

interface InputLicenseInfo {
    val: string;
    Trial: string;
    RegisterDate: string;
    ExpireDate: string;
    Brand: string;
    ProductNO: string;
    Count: string;
    Expired: string;
}

interface InputLicenseAdapter {
    Description: string[];
    IP: string[];
    MAC: string[];
    Key: { $: InputLicenseInfo }[];
}

interface InputLicenseJSON {
    License: {
        Adaptor: InputLicenseAdapter[];
    }
}

export class LicenseService {
    constructor() {
        fs.exists(`${configPath}/licensecap.xml`, (exists) => {
            if (!exists) {
                Log.Error("License", `licensecap not exists. should be located in: ${configPath}`);
            }
        });
    }

    /**
     * Verify License Key (29 digits), return license count.
     */
    public verifyLicenseKey(input: IVerifyLicenseKey): Promise<number> {
        return VerifyLicenseKey(input.key);
    }

    /**
     * Verify License XML, return true | false.
     */
    public verifyLicenseXML(input: IVerifyLicenseXML): Promise<boolean> {
        return VerifyLicenseXML(input.xml);
    }

    /**
     * Add License.
     */
    public addLicense(input: IAddLicense) {
        return AddLicense(input.xml);
    }

    /**
     * Get whole Licenses XML.
     */
    public getLicenseXML(): Promise<string> {
        return GetLicenseXML();
    }
    public getLicense(): Promise<LicenseInfo> {
        return GetLicense();
    }
}

export default new LicenseService();

