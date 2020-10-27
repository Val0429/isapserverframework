import { createMongoDB, sharedMongoDB, ensureCollectionExists } from "./../parse-server/parse-helper";
import { BehaviorSubject, Subject } from "rxjs";
import { serverReady } from "core/pending-tasks";
import { Db } from "mongodb";

export class CollectionWatcher {
    private sjDb: BehaviorSubject<Db> = new BehaviorSubject<Db>(null);
    private watched: { [key: string]: Subject<any> } = {};

    constructor() {
        this.init();
    }
    private async init() {
        await serverReady;

        let db = await sharedMongoDB();
        this.sjDb.next(db);
    }
    private async waitForDB(): Promise<Db> {
        let db = this.sjDb.getValue();
        if (db) return db;
        return this.sjDb.filter(v=>!!v).first().toPromise();
    }

    public async watch(collectionName: string): Promise<Subject<any>> {
        await serverReady;

        await ensureCollectionExists(collectionName);
        let watched = this.watched[collectionName];
        if (watched) return watched;
        let db = await this.waitForDB();
        let instance = db.collection(collectionName);
        let stream = instance.watch();
        watched = this.watched[collectionName] = new Subject<any>();
        stream.on("change", (change) => {
            /// operation type: insert | delete | replace | update
            watched.next(change);
        });
        stream.on("error", () => {});
        return watched;
    }
}
export default new CollectionWatcher();
