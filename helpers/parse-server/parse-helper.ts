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

export * from './parse-helper-core';

export async function createMongoDB(): Promise<{ client: MongoClient; db: Db }> {
    let { ip, port, collection } = Config.mongodb;
    const url = mongoDBUrl();

    let client = await MongoClient.connect(url, { useNewUrlParser: true, poolSize: 100, useUnifiedTopology: true });
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
    let dbs = await db.listCollections({ name: collectionName }).toArray();
    if (dbs.length === 0) {
        await new Promise((resolve, reject) =>
            db.createCollection(collectionName, (err, res) => {
                err && reject(err);
                !err && resolve(res);
            }),
        );
    }
    mutex.release();
}

export async function createIndex(collectionName: string, indexName: string, fieldOrSpec: any, options: IndexOptions = {}) {
    let db = await sharedMongoDB();

    var instance = db.collection(collectionName);
    try {
        if (!(await instance.indexExists(indexName))) throw null;
    } catch (reason) {
        var showname = collectionName.replace(/^\_/, '');
        Log.Info('Indexing', `Make index on <${showname}.${indexName}>.`);
        instance.createIndex(fieldOrSpec, { background: true, name: indexName, ...options });
    }
}
