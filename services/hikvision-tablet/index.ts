var edge = require('edge-js');
import { promisify } from 'bluebird';
import * as fs from 'fs';
import { Log } from 'helpers/utility';
import { BehaviorSubject } from 'rxjs';

// const configPath: string = `${__dirname}/../../workspace/custom/license/`;
const dllPath: string = `${__dirname}/lib/LibHikvisionAcsGateWay.dll`;

const CreateInstance: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibHikvisionAcsGateWay.Startup',
    methodName: 'CreateInstance'
}));

const DisposeInstance: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibHikvisionAcsGateWay.Startup',
    methodName: 'DisposeInstance'
}));

const EnableQRCode: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibHikvisionAcsGateWay.Startup',
    methodName: 'EnableQRCode'
}));

const CreateCardItem: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibHikvisionAcsGateWay.Startup',
    methodName: 'CreateCardItem'
}));

const RemoveCardItem: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibHikvisionAcsGateWay.Startup',
    methodName: 'RemoveCardItem'
}));

const EnrollFace: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibHikvisionAcsGateWay.Startup',
    methodName: 'EnrollFace'
}));

interface ICreateInstance {
    ip: string;
    port: number;
    account: string;
    password: string;
}

interface ICardInstance {
    instance: string;
}

interface ICreateCard {
    cardno: string;
    employeeno?: string;
    name?: string;
    start?: Date;
    end?: Date;
}
type ICreateCardItem = ICreateCard & ICardInstance;

interface IRemoveCard {
    cardno: string;
}
type IRemoveCardItem = IRemoveCard & ICardInstance;

interface IEnrollFace {
    cardno: string;
    facelen: number;
    buffer: Buffer;
}

interface IEnableQRCode {
    instance: string;
}

export interface IHikvisionTablet {
    ip: string;
    port: number;
    account: string;
    password: string;
}

const tablets: Map<string, HikvisionTablet> = new Map<string, HikvisionTablet>();

var path = require('path');
var exec = require('child_process').execFile;
var exeDir = path.resolve(__dirname, ".//lib");
var exePath = `${exeDir}\\ExeProgram.exe`;
export class HikvisionTablet {
    public static getInstance(config: IHikvisionTablet) {
        let key = JSON.stringify(config);
        if (tablets.has(key)) return tablets.get(key);
        let tablet = new HikvisionTablet(config);
        tablets.set(key, tablet);
        return tablet;
    }

    private config: IHikvisionTablet;
    constructor(config: IHikvisionTablet) {
        this.config = config;
    }

    public async createCard(card: ICreateCard) {
        let args = [this.config.ip, this.config.port, this.config.account, this.config.password, "CreateCardItem", card.cardno];
        do {
            if (!card.employeeno) {
                if (!card.name) break;
                else card.employeeno = card.cardno;
            }
            args.push(card.employeeno);
            if (!card.name) break;
            args.push(card.name);
            if (!card.start) break;
            args.push(card.start.getFullYear());
            args.push(card.start.getMonth()+1);
            args.push(card.start.getDate());
            if (!card.end) break;
            args.push(card.end.getFullYear());
            args.push(card.end.getMonth()+1);
            args.push(card.end.getDate());

        } while(false);

        return new Promise( (resolve) => {
            exec(exePath, args, { cwd: exeDir }, (err, stdout, stderr) => {
                resolve();
            });
        })
    }
    public async removeCard(card: ICreateCard) {
        let args = [this.config.ip, this.config.port, this.config.account, this.config.password, "RemoveCardItem", card.cardno];
        return new Promise( (resolve) => {
            exec(exePath, args, { cwd: exeDir }, (err, stdout, stderr) => {
                resolve();
            });
        })
    }

    public async enrollFace(face: IEnrollFace) {
        let tmpfile = `${__dirname}\\${new Date().valueOf()}.dat`;
        fs.writeFileSync(tmpfile, face.buffer);
        let args = [this.config.ip, this.config.port, this.config.account, this.config.password, "EnrollFace", face.cardno, tmpfile];
        return new Promise( (resolve) => {
            exec(exePath, args, { cwd: exeDir }, (err, stdout, stderr) => {
                fs.unlinkSync(tmpfile);
                resolve();
            });
        })
    }    
}
// export class HikvisionTablet {
//     public static getInstance(config: IHikvisionTablet) {
//         let key = JSON.stringify(config);
//         if (tablets.has(key)) return tablets.get(key);
//         let tablet = new HikvisionTablet(config);
//         tablets.set(key, tablet);
//         return tablet;
//     }

//     private config: IHikvisionTablet;
//     private sjInstance: BehaviorSubject<any> = new BehaviorSubject<any>(null);
//     constructor(config: IHikvisionTablet) {
//         this.config = config;
//         CreateInstance(config)
//             .then( (instance) => {
//                 this.sjInstance.next( instance );
//             });
//     }

//     public async createCard(card: ICreateCard) {
//         return CreateCardItem({
//             instance: await this.waitForInstance(),
//             ...card
//         });
//     }
//     public async removeCard(card: ICreateCard) {
//         return RemoveCardItem({
//             instance: await this.waitForInstance(),
//             ...card
//         });
//     }

//     public async enrollFace(face: IEnrollFace) {
//         return EnrollFace({
//             instance: await this.waitForInstance(),
//             ...face
//         });
//     }

//     private async waitForInstance(): Promise<any> {
//         let instance = this.sjInstance.getValue();
//         if (instance) return instance;
//         return this.sjInstance.filter(v=>v).first().toPromise();
//     }
// }
