import { waitServerReady } from './../../../core/pending-tasks';
import { MongoClient } from 'mongodb';
import { Config } from './../../../core/config.gen';

waitServerReady(async () => {
    let { ip, port, collection } = Config.mongodb;
    const url = `mongodb://${ip}:${port}`;

    let client = await MongoClient.connect(url);
    let db = client.db(collection);

    /// Session ////////////////
    var instance = db.collection('_Session');
    var name = "expiresTTL";
    if (!(await instance.indexExists(name))) {
        console.log(`Indexing <_Session>...`);
        instance.createIndex({
            expiresAt: -1
        }, {expireAfterSeconds: 0, background: true, name});
    }
    ////////////////////////////
});