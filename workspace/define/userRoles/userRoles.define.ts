var userRoles: Config[] = [
    [0, "Administrator"],

    [1, "Tenant", `
        /**
         * Which floor this Tenant is in.
         */
        floor: number;
        /**
         * Tenant's company name.
         */
        companyName: string;
        /**
         * Tenant's contact person name.
         */
        contactPerson: string;
        /**
         * Tenant's contact phone number.
         */
        contactNumber: string;
    `],

    [2, "Kiosk", `
        /**
         * Name of this kiosk.
         */
        kioskId: string;
        kioskName: string;
    `],

    [99, "SystemAdministrator"]
];

export default userRoles;

export type Config = [number, string, string] | [number, string];