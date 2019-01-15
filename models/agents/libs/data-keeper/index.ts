import { EnumAgentResponseStatus, ITaskFunctionDataKeeping, IDataKeeperStorage } from "../core";
import { ISocketDelegatorRequest } from "../socket-manager";
import { BehaviorSubject, Subject } from "rxjs";
import { idGenerate } from "../id-generator";
import { DataStorage, collection } from "./data-storage";
import { createIndex } from "helpers/parse-server/parse-helper";

export interface IDataKeeperConfig {
    rule: ITaskFunctionDataKeeping;
    requestKey: string;
    request: ISocketDelegatorRequest;
}


export class DataKeeper {
    private config: IDataKeeperConfig;
    private sjDataKeepingReceive: Subject<IDataKeeperStorage> = new Subject<IDataKeeperStorage>();
    private dataSet: IDataKeeperStorage[] = [];
    private static indexCreated: boolean = false;
    constructor(config: IDataKeeperConfig) {
        this.config = config;
        if (!DataKeeper.indexCreated) {
            /// create index
            createIndex(collection, "expiresTTL",
                { expiresAt: -1 },
                { expireAfterSeconds: 0 }
            );
            DataKeeper.indexCreated = true;
        }
        /// keep pushing until disposed
        this.sjDataKeepingReceive.takeUntil(this.sjDisposed.filter(v=>v)).subscribe( (data) => {
            /// push data to resolve
            this.dataSet.push(data);
            /// save db
            DataStorage.next(data);
        });
        this.poll();
    }

    private sjDisposed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    Dispose() {
        this.sjDisposed.next(true);
        this.dataSet = null;
    }

    /// private helpers
    private async poll() {
        let { response, waiter } = this.config.request;
        let result;
        do {
            let data: IDataKeeperStorage;
            /// listen signal for data
            if (this.dataSet.length > 0) {
                /// cleanup expires
                let now = new Date();
                while (this.dataSet.length > 0) {
                    if (this.dataSet[0].expiresAt.valueOf() <= now.valueOf()) this.dataSet.shift();
                    else break;
                }
                /// take data
                if (this.dataSet.length === 0) continue;
                data = this.dataSet.shift();
            } else {
                let result = await Promise.race([
                    this.sjDataKeepingReceive.first().mapTo(0).toPromise(),
                    this.sjDisposed.filter(v=>v).first().mapTo(1).toPromise()
                ]);
                if (result === 0) continue;
                if (result === 1) return;
            }

            /// send data and wait
            let value = data.data;
            switch (data.type) {
                case EnumAgentResponseStatus.Data:
                    response.next(value);
                    await waiter.wait(value);
                    break;
                case EnumAgentResponseStatus.Error:
                    response.error(value);
                    await waiter.wait(value);
                    break;
                case EnumAgentResponseStatus.Complete:
                    response.complete();
                    await waiter.wait();
                    break;
                default: throw "<DataKeeper> should not happen.";
            }
            /// redraw db
            DataStorage.redraw(data);

        } while(1);
    }

    private async loadData() {

    }

    private packIDataKeeperStorage(type: EnumAgentResponseStatus, value: any = undefined): IDataKeeperStorage {
        let data = value;
        /// initial structure
        switch (type) {
            case EnumAgentResponseStatus.Data: data = data || {}; break;
            case EnumAgentResponseStatus.Error: data = { error: value }; break;
            case EnumAgentResponseStatus.Complete: data = {}; break;
            default: throw "<DataKeeper> should not happen";
        }
        
        /// add preset timestamp
        let now = new Date();
        data.timestamp = now;
        
        /// pack into IDataKeeperStorage
        let rtn: IDataKeeperStorage = {
            storageId: idGenerate(),
            requestKey: this.config.requestKey,
            type,
            data,
            expiresAt: new Date(now.valueOf() + this.config.rule.durationSeconds*1000)
        }
        return rtn;
    }

    private next(value) {
        this.sjDataKeepingReceive.next(
            this.packIDataKeeperStorage(EnumAgentResponseStatus.Data, value)
        );
    }

    private error(error) {
        this.sjDataKeepingReceive.next(
            this.packIDataKeeperStorage(EnumAgentResponseStatus.Error, error)
        );
    }

    private complete() {
        this.sjDataKeepingReceive.next(
            this.packIDataKeeperStorage(EnumAgentResponseStatus.Complete)
        );
    }
}
