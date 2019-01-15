import { IDataKeeperStorage } from "../core";
import { Observable } from "rxjs";
import { createMongoDB } from "helpers/cgi-helpers/core";

export const collection: string = "AgentDataKeeping";
const keeping: IDataKeeperStorage[] = [];
const removing: string[] = [];

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
