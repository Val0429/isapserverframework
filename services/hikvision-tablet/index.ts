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
export class HikvisionTablet {
    public static getInstance(config: IHikvisionTablet) {
        let key = JSON.stringify(config);
        if (tablets.has(key)) return tablets.get(key);
        let tablet = new HikvisionTablet(config);
        tablets.set(key, tablet);
        return tablet;
    }

    private config: IHikvisionTablet;
    private sjInstance: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    constructor(config: IHikvisionTablet) {
        this.config = config;
        CreateInstance(config)
            .then( (instance) => {
                this.sjInstance.next( instance );
            });
    }

    public async createCard(card: ICreateCard) {
        return CreateCardItem({
            instance: await this.waitForInstance(),
            ...card
        });
    }
    public async removeCard(card: ICreateCard) {
        return RemoveCardItem({
            instance: await this.waitForInstance(),
            ...card
        });
    }

    public async enrollFace(face: IEnrollFace) {
        return EnrollFace({
            instance: await this.waitForInstance(),
            ...face
        });
    }

    private async waitForInstance(): Promise<any> {
        let instance = this.sjInstance.getValue();
        if (instance) return instance;
        return this.sjInstance.filter(v=>v).first().toPromise();
    }
}
