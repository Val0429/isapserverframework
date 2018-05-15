import * as Parse from 'parse/node';

export interface IRole {
    name: string;
}

export interface IUser {
    username: string;
    password: string;
    email?: string;
}

export interface IHost {
    /** Host 擁有者 */
    owner: Parse.User;
    /** 樓層 */
    floor?: number;
    /** 公司名稱 */
    companyName: string;
    /** 聯絡人名稱 */
    contactPerson: string;
    /** 聯絡人號碼 */
    contactNumber: string;
}

export interface IHostEvent {
    /** Host User */
    host: IHost;
    /** 訪客 */
    visitor: IVisitor;
    /** 本次的訪客名稱 */
    visitorName: string;
    /** 本次訪客的照片 */
    visitorAvatarImage?: Parse.File;
    /** 狀態 */
    status: string;
    /** 目的 */
    purpose: string;
    /** 通行人類型 (待移除) */
    visitorType?: string;
    /** 訪問時間，僅日期（開始） */
    visitFrom: Date;
    /** 訪問時間，僅日期（結束） */
    visitTo: Date;
    /** OTP Passcode */
    otpCode?: string;
}

export interface IVisitor {
    /** Visitor 擁有者 */
    owner: Parse.User;
    /** 訪客名稱 */
    name: string;
    // /** 訪客聯絡電話 (for VMS) */
    // contactNumber?: string;
    // /** 護照/身分證圖片 (for VMS) */
    // documentImage?: Parse.File;
    // /** 護照/身分證號碼 (for VMS) */
    // documentNumber?: string;
    /** 訪客群組 */
    groups?: IVisitorGroup[];
    data?: any;
    validStartDate: Date;
    validEndDate: Date;
}

export interface IVisitorGroup {
    name: string;
    sequence: number;
    watch: boolean;
}

interface ILoginResult extends IUser {
    sessionToken: string;
}


const registerSubclass = (collectionName?) =>
    targetClass =>
        Parse.Object.registerSubclass(collectionName || targetClass.name, targetClass);

function AsParseObject(name) {
    class ParseObject<T> extends Parse.Object {
        constructor(data?: Partial<T>) {
            super(name);
            data && super.set(data);
        }
        getValue<U extends keyof T>(key: U): T[U] {
            return super.get(key);
        }
        setValue<U extends keyof T>(key: U, value: T[U], options?: Parse.Object.SetOptions): boolean {
            return super.set(key, <any>value, options);
        }
    }
    return ParseObject;
}