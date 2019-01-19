import { createMongoDB } from "helpers/cgi-helpers/core";
import { Db } from "mongodb";
import { BehaviorSubject } from "rxjs";
import { IAgentRequest, IOutputEvent, IOutputEventRaw, TimestampToken } from "../core";

class OutputEventSaver {
    private db: Db;
    private sjDBReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    constructor() {
        /// initial db connection
        createMongoDB().then( (data) => {
            this.db = data.db;
            this.sjDBReady.next(true);
        });
    }

    async save(user: Parse.User, request: IAgentRequest, data: any) {
        if (!this.db) await this.sjDBReady.filter(v=>v).first().toPromise();
        //this.db.collection()
        let collectionName = this.makeCollectionName(request);
        let col = this.db.collection(collectionName);
        col.save(this.makeEvent(user, request, data));
    }

    private collectionNameCache: Map<string, string> = new Map<string, string>();
    private makeCollectionName(request: IAgentRequest) {
        let requestKey = request.requestKey;
        let cache = this.collectionNameCache.get(requestKey);
        if (cache) return cache;

        /// convert agentType
        let agentType = request.agentType
            .toLowerCase()
            .replace(/[ \-]/g, "_");
        /// convert function name
        let funcName = request.funcName;
        /// make final name
        let collectionName = `agentdb.${agentType}.${funcName}`;
        return collectionName;
    }

    private makeEvent(user: Parse.User, request: IAgentRequest, data: any): IOutputEventRaw {
        let { [TimestampToken]: timestamp, ...finalData } = data;
        return {
            user: user.id,
            data: finalData,
            timestamp: data[TimestampToken] || new Date()
        }
    }
}

export default new OutputEventSaver();