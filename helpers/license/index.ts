import * as Enum from 'core/licenses.gen';
import licenseService from 'services/license';

export class License {
    /**
     * Get prodect id
     */
    public GetProdectId(productName: Enum.ELicenseProductName): string {
        try {
            let productId: string = Enum.ELicenseProductId[productName];

            return productId;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Convert prodect id to product name
     * @param productId
     */
    public GetProductName(productId: Enum.ELicenseProductId): string {
        try {
            let name: string = Enum.ELicenseProductName[productId];

            return name;
        } catch (e) {
            throw e;
        }
    }

    /**
     *
     */
    public async GetLicenses(): Promise<License.ILicense[]> {
        try {
            let license = await licenseService.getLicense();

            return license.licenses.map((value, index, array) => {
                return {
                    licenseKey: value.licenseKey,
                    description: value.description,
                    mac: value.mac,
                    brand: value.brand,
                    productNO: value.productNO,
                    productName: this.GetProductName(Enum.ELicenseProductId[value.productNO]),
                    count: value.count,
                    trial: value.trial,
                    registerDate: value.registerDate,
                    expireDate: value.expireDate,
                    expired: value.expired,
                };
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Check license
     * @param product
     */
    public async GetLicenseStatus(productId: Enum.ELicenseProductId): Promise<License.ILicenseStatus>;
    public async GetLicenseStatus(productName: Enum.ELicenseProductName): Promise<License.ILicenseStatus>;
    public async GetLicenseStatus(product: Enum.ELicenseProductId | Enum.ELicenseProductName): Promise<License.ILicenseStatus> {
        try {
            let license = await licenseService.getLicense();
            let licenseSummary = license.summary[Enum.ELicenseProductId[product]];

            let limit: number = licenseSummary ? licenseSummary.totalCount : 0;
            let count: number = 0;

            return {
                have: count,
                total: limit,
            };
        } catch (e) {
            throw e;
        }
    }

    /**
     * License Balance
     * @param product
     */
    public async GetLicenseBalance(productId: Enum.ELicenseProductId): Promise<number>;
    public async GetLicenseBalance(productName: Enum.ELicenseProductName): Promise<number>;
    public async GetLicenseBalance(product: Enum.ELicenseProductId | Enum.ELicenseProductName): Promise<number> {
        try {
            let status = await this.GetLicenseStatus(product as Enum.ELicenseProductId);

            return status.have - status.total;
        } catch (e) {
            throw e;
        }
    }
}

export namespace License {
    /**
     *
     */
    export interface ILicense {
        licenseKey: string;
        description: string;
        mac: string;
        brand: string;
        productNO: string;
        productName: string;
        count: number;
        trial: boolean;
        registerDate: string;
        expireDate: string;
        expired: boolean;
    }

    /**
     *
     */
    export interface ILicenseStatus {
        have: number;
        total: number;
    }
}
