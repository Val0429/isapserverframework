import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
} from './../../core/cgi-package';


export interface Input {
    sessionId: string;
}

export interface FloorUnit {
    floor: number;
    unitNo: string;
    phone: string[];
}

export type Output = FloorUnit[];

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.get(async (data) => {
    /// Check param requirement

    return [
        { floor: 1, unitNo: "#01-00", phone: ["65137500", "65137530"] },
        { floor: 2, unitNo: "#02-01", phone: ["63929881"] },
        { floor: 2, unitNo: "#02-01B", phone: ["8189-1636"] }
    ];
});
