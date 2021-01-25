/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

 /**
 * Create index helper.
 */
import { Config } from 'core/config.gen';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';
import { Log, Mutex } from 'helpers/utility';
import { any } from 'bluebird';
import { mongoDBUrl } from 'helpers/mongodb/url-helper';

export * from "./parse-helper-core";

export async function createMongoDB(): Promise<{ client: MongoClient, db: Db }> {
    let { ip, port, collection } = Config.mongodb;
    const url = mongoDBUrl();

    let client = await MongoClient.connect(url, {useNewUrlParser: true, poolSize: 100, useUnifiedTopology: true});
    let db = client.db(collection);

    /// check collection exists
    
    // await mutex.acquire();
    // let dbs = await db.listCollections({ name: collection }).toArray();
    // if(dbs.length === 0) {
    //     await new Promise( (resolve, reject) => db.createCollection(collection, (err, res) => {
    //         err && reject(err);
    //         !err && resolve(res);
    //     }) );
    // }
    // mutex.release();

    return { client, db };
}

let sharedClient: MongoClient = null;
let sharedDb: Db = null;
export async function sharedMongoDB(): Promise<Db> {
    if (sharedDb !== null) return sharedDb;
    let { client, db } = await createMongoDB();
    sharedClient = client;
    sharedDb = db;
    return sharedDb;
}

const mutex: Mutex = new Mutex();
export async function ensureCollectionExists(collectionName: string) {
    let db = await sharedMongoDB();
    /// ensure collection exists
    await mutex.acquire();
    await db.createCollection(collectionName, (err) => {});
    mutex.release();
}

export async function createIndex(collectionName: string, indexName: string, fieldOrSpec: any, options: IndexOptions = {}) {
    let db = await sharedMongoDB();
    await ensureCollectionExists(collectionName);
    var instance = db.collection(collectionName);
    try {
        if (!(await instance.indexExists(indexName))) throw null;
    } catch(reason) {
        var showname = collectionName.replace(/^\_/, '');
        Log.Info("Indexing", `Make index on <${showname}.${indexName}>.`);
        instance.createIndex(fieldOrSpec, {background: true, name: indexName, ...options});
    }
}

export async function dropIndex(collectionName: string, indexName: string) {
    let db = await sharedMongoDB();

    var instance = db.collection(collectionName);
    try {
        if (!!(await instance.indexExists(indexName))) throw null;
    } catch (reason) {
        var showname = collectionName.replace(/^\_/, '');
        Log.Info('Indexing', `Drop index on <${showname}.${indexName}>.`);
        await instance.dropIndex(indexName);
    }
}

/// magicString example: TTLUpdatedDate
/// field example: invitationDate
export async function createExpiringIndexByConfig(collection: string, magicString: string, days: number, field: string) {
    if (days === undefined) return;
    let db = await sharedMongoDB();
    let expireAfterSeconds = days*24*60*60;
    let regex = new RegExp(`^${magicString}_`);
    let regexMatch = new RegExp(`^${magicString}_(([0-9]*[.])?[0-9]+)`);
    await ensureCollectionExists(collection);
    let instance = db.collection(collection);
    let indexes = await instance.listIndexes().toArray();
    let touchDateIdx: string = indexes.reduce( (final, value) => {
        if (final) return final;
        if (regex.test(value.name)) return value.name;
    }, undefined);
    /// if exists, check day
    if (touchDateIdx) {
        let result: number = +touchDateIdx.match(regexMatch)[1];
        if (days !== result) {
            /// drop old index
            Log.Info("Dropping Index", `Drop Old ${collection} Recycle Index...`);
            await instance.dropIndex(touchDateIdx);
            /// create new index
            createIndex(collection, `${magicString}_${days}`,
                { [field]: 1 },
                { expireAfterSeconds }
            );
        }
    } else {
        /// create new index
        createIndex(collection, `${magicString}_${days}`,
            { [field]: 1 },
            { expireAfterSeconds }
        );
    }
}