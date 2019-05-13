import { createMongoDB } from 'helpers/parse-server/parse-helper';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';
import { makeReadyPromise } from 'helpers/utility/task-helper';
import { serverReady } from 'core/pending-tasks';
import { Log } from 'helpers/utility';

function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}

const digits: number = 6;
const unitSize: number = 4;
const collectionName: string = "Pins";

interface Pins {
    index: number;
    total: number;
    pin: Buffer;
}

export type Pin = string;

export class PinCode {
    private mongoClient: MongoClient;
    private mongoDb: Db;
    private pins: Promise<Pins>;

    // public async next(): Promise<Pin> {
    //     let pins = await this.pins;
    //     let { index, total, pin } = pins;
    //     pin = pin.buffer as any as Buffer;
    //     let result: string = pin.readUInt32BE((index % total) *unitSize) + "";
    //     /// update db
    //     let col = this.mongoDb.collection(collectionName);
    //     /// wait for update
    //     //await new Promise((resolve) => col.updateOne({}, { "$inc": { index: 1 } }, () => resolve() ) );
    //     col.updateOne({}, { "$inc": { index: 1 } });
    //     pins.index++;
    //     return result;
    // }

    public async next(): Promise<Pin>;
    public async next(count: number): Promise<Pin[]>;
    public async next(count: any = undefined): Promise<Pin | Pin[]> {
        let cnt = count === undefined ? 1 : count;
        let rtn: string[] = [];
        if (cnt <= 0) return rtn;
        let pins = await this.pins;
        let { index, total, pin } = pins;
        pin = pin.buffer as any as Buffer;

        for (let i=0; i<cnt; ++i) {
            let result: string = pin.readUInt32BE((index++ % total) *unitSize) + "";
            rtn.push(result);
        }
        /// update db
        let col = this.mongoDb.collection(collectionName);
        col.updateOne({}, { "$inc": { index: cnt } });
        pins.index = index;

        return count === undefined ? rtn[0] : rtn;
    }

    constructor() {
        /// make promise
        const { makeSubjectReady, waitSubjectReady } = makeReadyPromise<Pins>();
        this.pins = waitSubjectReady;

        (async () => {
            await serverReady;

            const { client, db } = await createMongoDB();
            this.mongoClient = client;
            this.mongoDb = db;

            /// Generate pin code
            let col = this.mongoDb.collection(collectionName);
            let max = Math.pow(10, digits);
            let min = max * 0.1;
            let totalSize = max - min;

            /// find exists Pins
            let pins: Pins = await col.findOne({});
            if (pins !== null) { makeSubjectReady(pins); return; }

            /// if not exists, create
            Log.Info("PinCode", "Creating...");
            let trace = Log.InfoTime("PinCode", `${digits} Digits PinCode Created`);
            let pinNumbers = new Array();
            for (let i=min, j=0; i<max; ++i, ++j) pinNumbers[j] = i;
            shuffle(pinNumbers);
            /// store into buffer
            let buf = new Buffer(totalSize*unitSize);
            for (let i=0; i<pinNumbers.length; ++i) buf.writeUInt32BE(pinNumbers[i], i*unitSize);
            /// Save into database
            col.insert({
                index: 0, total: totalSize, pin: buf
            }, () => {
                makeSubjectReady(pins);
                trace.end();
            });

        })();
    }
}

export default new PinCode();
