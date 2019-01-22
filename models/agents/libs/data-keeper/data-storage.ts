import { IDataKeeperStorage, TimestampToken } from "../core";
import { Observable } from "rxjs";
import { createMongoDB, sharedMongoDB } from "helpers/cgi-helpers/core";
import { Db, Collection } from "mongodb";

export const collection: string = "AgentDataKeeping";
const keeping: IDataKeeperStorage[] = [];
const removing: string[] = [];

/**
 * Data Storage delegation class,
 * to save into DB (next),
 * and to giveup save into DB (redraw).
 */

export class DataStorage {
    /// schedule save into db.
    static next(value: IDataKeeperStorage) {
        keeping.push(value);
    }

    /// redraw save into db.
    static redraw(value: IDataKeeperStorage) {
        /// find in keeping
        let idx = keeping.findIndex( (data) => data === value );
        if (idx >= 0) {
            keeping.splice(idx, 1);
        } else {
            removing.push(value.storageId);
        }
    }

    static async init(requestKey: string): Promise<IDataKeeperStorage[]> {
        let col = await this.initDBCollection();
        return await col.find({ requestKey }).toArray();
    }

    /// individual db connection for DataKeeping init
    private static db: Db;
    private static col: Collection<any>;
    private static async initDBCollection(): Promise<Collection<any>> {
        if (this.col) return this.col;
        const { db } = await createMongoDB();
        this.db = db;
        this.col = db.collection(collection);
        return this.col;
    }
}

/// schedule save into db
(async () => {
    const { client, db } = await createMongoDB();
    let col = db.collection(collection);

    Observable.timer(1000, 1000)
        .subscribe( () => {
            /// 1) insert keeping
            if (keeping.length > 0) {
                col.insertMany(keeping);
                keeping.length = 0;
            }
            /// 2) delete removing
            if (removing.length > 0) {
                col.deleteMany({ storageId: { $in: removing } });
                removing.length = 0;
            }
        });
})();
