import * as Parse from 'parse/node';

export interface IRole {
    name: string;
}

export interface IUser {
    username: string;
    password: string;
    email?: string;
    data?: IUserHost | IUserVisitor | any;
}

export interface IUserHost {
    /** 樓層 */
    floor?: number;
    /** 公司名稱 */
    companyName: string;
    /** 聯絡人名稱 */
    contactPerson: string;
    /** 聯絡人號碼 */
    contactNumber: string;
}

export interface IUserVisitor {
    /** 訪客名稱 */
    name: string;
    // /** 訪客聯絡電話 (for VMS) */
    // contactNumber?: string;
    // /** 護照/身分證圖片 (for VMS) */
    // documentImage?: Parse.File;
    // /** 護照/身分證號碼 (for VMS) */
    // documentNumber?: string;
    // /** 訪客群組 */
    // groups?: IVisitorGroup[];
    // data?: any;
    // validStartDate: Date;
    // validEndDate: Date;
}

// export interface IHostEvent {
//     /** Host User */
//     host: IUserHost;
//     /** 訪客 */
//     visitor: IUserVisitor;
//     /** 本次的訪客名稱 */
//     visitorName: string;
//     /** 本次訪客的照片 */
//     visitorAvatarImage?: Parse.File;
//     /** 狀態 */
//     status: string;
//     /** 目的 */
//     purpose: string;
//     /** 通行人類型 (待移除) */
//     visitorType?: string;
//     /** 訪問時間，僅日期（開始） */
//     visitFrom: Date;
//     /** 訪問時間，僅日期（結束） */
//     visitTo: Date;
//     /** OTP Passcode */
//     otpCode?: string;
// }

// export interface IVisitorGroup {
//     name: string;
//     sequence: number;
//     watch: boolean;
// }
