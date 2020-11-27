import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';
import * as Os from 'os';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Get
 */
type InputR = null;

type OutputR = INetwork[];

action.get(
    {
        permission: [RoleList.SystemAdministrator],
    },
    async (data): Promise<OutputR> => {
        try {
            return GetNetwork();
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Interface with ip
 */
export interface INetwork {
    ifname: string;
    family: string;
    address: string;
    mac: string;
}

/**
 * Get ip list
 */
export function GetNetwork(): INetwork[] {
    let ifaces = Os.networkInterfaces();

    let ips: INetwork[] = new Array<INetwork>()
        .concat(
            ...Object.keys(ifaces).map((ifname) => {
                return ifaces[ifname].map((iface) => {
                    if ('IPv4' === iface.family && iface.internal === false) {
                        return {
                            ifname: ifname,
                            family: iface.family,
                            address: iface.address,
                            mac: iface.mac.toUpperCase(),
                        };
                    }
                });
            }),
        )
        .filter((value, index, array) => {
            return value !== undefined;
        });

    return ips;
}
