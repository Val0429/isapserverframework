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

    [2, "Visitor", `
        /**
         * Name of this visitor.
         */
        name: string;
    `],

    [3, "Kiosk", `
        /**
         * Name of this kiosk.
         */
        name: string;
    `]
];

export default userRoles;

export type Config = [number, string, string] | [number, string];