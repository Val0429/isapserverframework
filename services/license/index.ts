var edge = require('edge-js');
import { promisify } from 'bluebird';
import * as fs from 'fs';
import { Log } from 'helpers/utility';
var xmlParser = new (require('xml2js')).Parser();

const configPath: string = `${__dirname}/../../workspace/custom/license/`;
const dllPath: string = `${__dirname}/lib/LibLicenseManager.dll`;

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
let VerifyLicenseKey: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibLicenseManager.Startup',
    methodName: 'VerifyLicenseKey'
}));

interface IVerifyLicenseXML {
    xml: string;
}
let VerifyLicenseXML: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibLicenseManager.Startup',
    methodName: 'VerifyLicenseXML'
}));

interface IAddLicense {
    xml: string;
}
let AddLicense: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibLicenseManager.Startup',
    methodName: 'AddLicense'
}));

let GetLicenseXML: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibLicenseManager.Startup',
    methodName: 'GetLicenseXML'
}));

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
    public async verifyLicenseKey(input: IVerifyLicenseKey): Promise<number> {
        return await VerifyLicenseKey({ path: configPath, ...input });
    }

    /**
     * Verify License XML, return true | false.
     */
    public async verifyLicenseXML(input: IVerifyLicenseXML): Promise<boolean> {
        return await VerifyLicenseXML({ path: configPath, ...input });
    }

    /**
     * Add License.
     */
    public async addLicense(input: IAddLicense) {
        return await AddLicense({ path: configPath, ...input });
    }

    /**
     * Get whole Licenses XML.
     */
    public async getLicenseXML(): Promise<string> {
        return await GetLicenseXML({ path: configPath });
    }
    public async getLicenseJSON(): Promise<InputLicenseJSON> {
        return new Promise<InputLicenseJSON>( async (resolve) => {
            xmlParser.parseString( await GetLicenseXML({ path: configPath }), (err, data) => {
                resolve(data);
            });
        });
    }
    public async getLicense(): Promise<LicenseInfo> {
        let result: LicenseInfo = {
            licenses: [], summary: {}
        }
        let data: InputLicenseJSON = await this.getLicenseJSON();
        let adaptors = data.License.Adaptor;
        for (let i=0; i<adaptors.length; ++i) {
            let adapter = adaptors[i];
            if (!adapter.Key || adapter.Key.length === 0) continue;
            for (let j=0; j<adapter.Key.length; ++j) {
                let lic = adapter.Key[j].$;
                /// push into license
                let license = {
                    licenseKey: lic.val,
                    description: adapter.Description[0],
                    mac: adapter.MAC[0],
                    brand: lic.Brand,
                    productNO: lic.ProductNO,
                    count: +lic.Count,

                    trial: lic.Trial === '0' ? false : true,
                    registerDate: lic.RegisterDate,
                    expireDate: lic.ExpireDate,
                    expired: lic.Expired === undefined || lic.Expired === '0' ? false : true
                };
                result.licenses.push(license);
                if (license.expired === true) continue;
                if (result.summary[license.productNO]) result.summary[license.productNO].totalCount += license.count;
                else result.summary[license.productNO] = { totalCount: license.count };
            }
        }
        return result;
    }
}

export default new LicenseService();
