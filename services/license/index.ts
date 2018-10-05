var edge = require('edge-js');
import { promisify } from 'bluebird';
import * as fs from 'fs';
import { Log } from 'helpers/utility';

const configPath: string = `${__dirname}/../../workspace/custom/license/`;
const dllPath: string = `${__dirname}/lib/LibLicenseManager.dll`;

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
}

export default new LicenseService();
