import { Config } from 'core/config.gen';
import * as request from 'request';
import * as http from 'http';
import { client } from 'websocket';
import { Observable, BehaviorSubject, Subject, Observer } from 'rxjs';
import { Response } from '~express/lib/response';
import { promisify } from 'bluebird';
import { FaceFeatureCompare } from './../modules/face-feature-compare';
import { UserType, sjRecognizedUser, sjUnRecognizedUser, RecognizedUser, UnRecognizedUser } from './frs-service/core';
export * from './frs-service/core';
import { filterFace } from './frs-service/filter-face';
import { semaphore } from './frs-service/semaphore';
import { Semaphore } from 'helpers/utility/semaphore';
import { Cameras } from './../models/cameras';
import { searchRecognizedFace } from './frs-service/search-recognized-face';
import { searchUnRecognizedFace } from './frs-service/search-unrecognized-face';
import { saveSnapshot } from './frs-service/save-snapshot';
import * as mongo from 'mongodb';

const collection: string = "FRSFaces";

const groups: string[] = Config.fts.groupInfo.map( (data) => data.name );

export interface FetchOptions {
    excludeFaceFeature?: boolean;
    name?: string;
    groups?: string[];
    cameras?: string[];
}

export class FRSService {
    private sessionId: string;
    private sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private sjRecovered: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private livestream: Observable<RecognizedUser | UnRecognizedUser>;
    public sjLiveFace: Subject<RecognizedUser | UnRecognizedUser> = new Subject();

    private db: mongo.Db;

    constructor() {
        this.login();

        (async () => {
            /// create db
            const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
            let client = await mongo.MongoClient.connect(url);
            this.db = client.db(Config.mongodb.collection);

            /// init main stream
            this.livestream = Observable.merge(sjRecognizedUser, sjUnRecognizedUser)
                .pipe( filterFace( async (compared) => {
                    await this.waitForRecover();
                    await this.waitForLogin();
                    this.sjLiveFace.next(compared);
                }) );

            /// recover db
            this.recoverDB();

            /// write db
            this.writeDB();

        })();
    }

    /// public functions ////////////////////
    /// load faces from db
    lastImages(start: number = null, end: number = null, options: FetchOptions = {}): Subject<RecognizedUser | UnRecognizedUser> {
        if (end === null || start === null) {
            const hours = 60*60*1000;
            end = Date.now() + hours; //Date.now();
            start = end - 8 * hours;
        }
        return this.localFetchAll(start, end, options);
    }
    snapshot(image: string, resp: Response = null): Promise<string> {
        return new Promise<string>( async (resolve, reject) => {
            await this.waitForLogin();
            var url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
            request({
                url,
                method: 'GET',
                encoding: null
            }, (err, res, body) => {
                if (err) { reject(err); return; }
                if (resp !== null) {
                    resp.setHeader("content-type", res.headers["content-type"]);
                    resp.end(body, "binary");
                }
                resolve(body);
            });
        });
    }
    /// load faces from db
    localFetchAll(starttime: number, endtime: number, options: FetchOptions = {}) {
        options = {
            excludeFaceFeature: false,
        ...options};
        var sj = new Subject<RecognizedUser | UnRecognizedUser>();

        (async () => {
            await this.waitForRecover();

            /// read local db
            let col = this.db.collection(collection);

            // let result = col.find({
            //     '$text': {
            //         '$search': 'Morris'
            //     },
            //     'timestamp': {
            //         '$gte': starttime,
            //         '$lte': endtime
            //     },
            //     'groups.name': { '$in': [ null, /^./ ] },
            //     'channel': 'Camera_04_01',
            // }).sort({timestamp: 1});

            let query = {
                'timestamp': {
                    '$gte': starttime,
                    '$lte': endtime
                },
            }
            /// add name: text search, if exists
            if (options.name) query['$text'] = { '$search': options.name };
            /// group name
            if (!options.groups) query['groups.name'] = { '$in': [null, ...groups] };
            else {
                /// workaround for 'No Match'
                if (options.groups.indexOf('No Match') >= 0) options.groups.unshift(null);
                query['groups.name'] = { '$in': options.groups };
            }
            /// channel
            if (options.cameras) query['channel'] = { '$in': options.cameras };
            else {
                let pCameras = await new Parse.Query(Cameras).find();
                let cameras: string[] = pCameras.map( (data) => data.getValue("sourceid") );
                query['channel'] = { '$in': [null, ...cameras] };
            }
            /// execute
            let result = col.find(query).sort({timestamp: 1});

            if (options.excludeFaceFeature === true) {
                result = result.project({ face_feature: 0 });
            }

            // console.log('???', await result.explain());

            result.forEach((data) => {
                sj.next(data);
            }, () => sj.complete());

        })();

        return sj;
    }
    /// load faces from remote FRS
    fetchAll(starttime: number, endtime: number, pageSize: number = 20): Subject<RecognizedUser | UnRecognizedUser> {
        var sj = new Subject<RecognizedUser | UnRecognizedUser>();

        const url: string = this.makeUrl('getverifyresultlist');
        const urlnon: string = this.makeUrl('getnonverifyresultlist');

        /// get raw data from FRS, merge all pages
        function poll(starttime: number, endtime: number, url: string, page: number = 0): Observable<RecognizedUser[] | UnRecognizedUser[]> {
            function doRequest(observer: Observer<any>, page: number = 0)  {
                let bodyparam = { session_id: this.sessionId, start_time: starttime, end_time: endtime, page_size : 20, skip_pages: page };
                request({
                    url,
                    method: 'POST',
                    json: true,
                    body: bodyparam
                }, (err, res, body) => {
                    // console.log('body', body);
                    var result = (body.result || body.group_list || {});
                    var results = result.verify_results;
                    //console.log(url, bodyparam, results.length);
                    if (!results || results.length === 0) {
                        observer.complete();
                        return;
                    }
                    observer.next(results);
                    doRequest.call(this, observer, result.page_index+1);
                });
            }

            return Observable.create( (observer) => {
                doRequest.call(this, observer);
            }).share();
        }

        /// indexes
        var recog = { timestamp: 0, finished: false, data: [] };
        var unrecog = { timestamp: 0, finished: false, data: [] };
        var queue = [];
       
        /// finalize search result
        async function queueHandler() {
            while (queue.length > 0) {
                sj.next(queue.shift());
            }

            if (recog.finished === true && unrecog.finished === true)
                sj.complete();
        }

        function prepareQueue(recognizeBase: boolean) {
            var base = recognizeBase ? recog : unrecog;
            var ref = recognizeBase ? unrecog : recog;
            //if (base.data.length === 0) return;
            while (base.data.length > 0) {
                /// 1) get time
                var basetime = base.data[0].timestamp;
                var reftime = ref.data.length > 0 ? ref.data[0].timestamp : Number.MAX_SAFE_INTEGER;
                /// 2) if >= ref timestamp, return
                if (!ref.finished && basetime > ref.timestamp) return;
                /// 3) pick one smaller
                if (basetime <= reftime) queue.push( base.data.shift() );
                else queue.push( ref.data.shift() );
            }
            queueHandler();
        }

        (async () => {
            await this.waitForLogin();

            /// handle response
            var obRecog = poll.call(this, starttime, endtime, url);
            obRecog.subscribe({
                    next: (data: RecognizedUser[]) => {
                        recog.timestamp = data[data.length-1].timestamp;
                        data.forEach( (value: RecognizedUser) => value.type = UserType.Recognized );
                        recog.data.push.apply(recog.data, data);
                        prepareQueue(true);
                    },
                    complete: () => {
                        recog.finished = true;
                        prepareQueue(true);
                    }
                });
            var obUnRecog = poll.call(this, starttime, endtime, urlnon);
            obUnRecog.subscribe({
                    next: (data: UnRecognizedUser[]) => {
                        unrecog.timestamp = data[data.length-1].timestamp;
                        data.forEach( (value: UnRecognizedUser) => value.type = UserType.UnRecognized );
                        unrecog.data.push.apply(unrecog.data, data);
                        prepareQueue(false);
                    },
                    complete: () => {
                        unrecog.finished = true;
                        prepareQueue(false);
                    }
                });

            Observable.forkJoin(obRecog, obUnRecog)
                .subscribe( () => {
                    /// combine last
                    var final = [ ...recog.data, ...unrecog.data ].sort( (a, b) => a.timestamp - b.timestamp );
                    queue.push.apply(queue, final);
                    queueHandler();
                });
        })();
       
        return sj;
    }

    search(face: RecognizedUser | UnRecognizedUser, starttime: number, endtime: number): Subject<RecognizedUser | UnRecognizedUser> {
        let sj = new Subject<RecognizedUser | UnRecognizedUser>();

        (async () => {
            /// 0) extract back timestamp from snapshot
            let snapshot = face.snapshot;
            let regex = /^[^0-9]*([0-9]+)/;
            let timestamp = +snapshot.match(regex)[1];

            /// 1) get back face_feature
            let faceFeature, faceBuffer;
            let backs: any[] = await this.fetchAll(timestamp, timestamp)
                .bufferCount(Number.MAX_SAFE_INTEGER)
                .toPromise();

            /// 1.1) FRS record being deleted. try again within local db.
            if (backs === undefined) {
                backs = await this.localFetchAll(face.timestamp, face.timestamp)
                    .bufferCount(Number.MAX_SAFE_INTEGER)
                    .toPromise();
            }
            if (backs === undefined) backs = [];

            for (var back of backs) {
                if (snapshot === back.snapshot) {
                    faceFeature = back.face_feature;
                    break;
                }
            }
            faceBuffer = new Buffer(faceFeature, 'binary');

            /// 2)
            /// 2.1) adjust starttime / endtime with possible companion duration
            let adjustStartTime = starttime - Config.fts.possibleCompanionDurationSeconds*1000;
            let adjustEndTime = endtime + Config.fts.possibleCompanionDurationSeconds*1000;
            this.localFetchAll(adjustStartTime, adjustEndTime, { excludeFaceFeature: face.type === UserType.Recognized ? true : false })
                .pipe( semaphore<RecognizedUser | UnRecognizedUser>(16, async (data) => {
                    if (face.type === UserType.UnRecognized && data.type === UserType.UnRecognized) {
                        // //var buffer = new Buffer(data.face_feature, 'binary');
                        let buffer = (data.face_feature as any).buffer;
                         var score = await FaceFeatureCompare.async(faceBuffer, buffer);
                        data.score = score;
                    }
                    return data;
                }) )
                .pipe( face.type === UserType.Recognized ? searchRecognizedFace(face) : searchUnRecognizedFace(face) )
                .subscribe( async (data) => {
                    sj.next(data);

                }, () => {}, async () => {
                    sj.complete();
                });

        })();
        
        return sj;
    }
    /////////////////////////////////////////

    /// private functions ///////////////////
    private loggingIn: boolean = false;
    private maintainTimer: NodeJS.Timer = null;
    private login() {
        const url = this.makeUrl("login");

        let tryLogin = () => {
            if (this.loggingIn === true) return;
            this.loggingIn = true;

            request({
                url, method: 'POST', json: true,
                body: { username: Config.frs.account, password: Config.frs.password }
            }, (err, res, body) => {
                this.loggingIn = false;
                if (err || !body) {
                    console.log(`Login FRS Server failed@${Config.frs.ip}:${Config.frs.port}. Retry in 1 second.`);
                    setTimeout(() => { tryLogin() }, 1000);
                    return;
                }

                this.sjLogined.next(true);
                console.log(`Login into FRS Server@${Config.frs.ip}:${Config.frs.port}.`);

                this.sessionId = body.session_id;
                /// After login and got session_id, maintain session every 1 minute.
                if (this.maintainTimer !== null) clearInterval(this.maintainTimer);
                this.maintainTimer = setInterval( async () => {
                    var result = await this.maintainSession();
                    if (!result) clearInterval(this.maintainTimer);
                }, 60000);
                this.doWebsocketListen();
            });
            
        }
        tryLogin();
    }

    private maintainSession(): Promise<boolean> {
        const url: string = this.makeUrl('maintainsession');
        var me = this;

        return new Promise( (resolve, reject) => {
            request({
                url, method: 'POST', json: true,
                body: { session_id: this.sessionId }
            }, (err, res, body) => {
                if (!body || body.message === 'Unauthorized.') {
                    this.sjLogined.next(false);
                    console.log(`Maintain FRS session failed@${Config.frs.ip}:${Config.frs.port}.`);
                    resolve(false);
                    me.login();
                    return;
                }
                console.log('maintain success', body);
                resolve(true);
            });

        });
    }

    websocketInited: boolean = false;
    private doWebsocketListen() {
        if (this.websocketInited) return;
        this.websocketInited = true;
        function makeConnection(url: string, callback: (data: any) => void) {
            var cli = new client();
            var me = this;
            var timer;
            function reconnect() {
                timer && clearTimeout(timer);
                timer = setTimeout( () => makeConnection.call(me, url, callback), 1000 );
            }

            cli.on('connect', (connection) => {
                connection.on('error', (err) => {
                    console.log("FRS Connection Error", err);
                    reconnect();
                });
                connection.on('close', () => {
                    console.log("FRS Connection Closed");
                    reconnect();
                });
                connection.on('message', (message) => {
                    var data = eval(`(${message.utf8Data})`);
                    let code = (<any>data).code;
                    if (code) {
                        if (code === 200) return;
                        if (code === 401) {
                            console.log('FRS error, message', data);
                            me.login();
                            return;
                        }
                        console.log('FRS error, message', data);
                        return;
                    }
                    callback && callback(data);
                });
                connection.sendUTF(JSON.stringify({
                    "session_id": this.sessionId
                }));
            });
            cli.on('connectFailed', (err) => {
                console.log("FRS Connect Error: ", err);
                    setTimeout( () => reconnect() );
            });
            cli.connect(url, 'echo-protocol');
        }

        const url: string = `ws://${Config.frs.ip}:${Config.frs.wsport}/frs/ws/fcsreconizedresult`;
        const urlnon: string = `ws://${Config.frs.ip}:${Config.frs.wsport}/frs/ws/fcsnonreconizedresult`;
        makeConnection.call(this, url, (data: RecognizedUser) => {
            // console.log('recognized result', data);
            sjRecognizedUser.next({type: UserType.Recognized, ...data});
        });
        makeConnection.call(this, urlnon, (data: UnRecognizedUser) => {
            // console.log('unrecognized result', data);
            sjUnRecognizedUser.next({type: UserType.UnRecognized, ...data});
        });
    }

    private async recoverDB() {
        await this.waitForLogin();

        console.log("<Recover FRS DB> Started...");

        /// read local db
        let col = this.db.collection(collection);

        /// get last timestamp
        let result = await col.find().sort({timestamp: -1}).limit(1).toArray();
        //let lastTimestamp = Date.now() - 60*60*1000*8;
        let lastTimestamp = 0;
        if (result.length !== 0) lastTimestamp = result[0].timestamp+1;

        /// prepare save every 1 second
        let prev = 0;
        let count = 0;
        let sjBatchSave: Subject<any> = new Subject();
        let allPromises = [];

        /// save snapshots
        let ssCount = 0;
        let bsSnapshotSubscription = sjBatchSave
            .pipe( saveSnapshot(12) )
            .subscribe({
                next: () => ++ssCount,
                complete: () => {
                    if (ssCount > 0) console.log(`<Recover FRS DB> ${ssCount} of snapshots saved.`);
                }
            });

        /// batch and save to db
        let bsSubscription = sjBatchSave.bufferTime(1000)
            .subscribe( (data: any[]) => {
                if (data.length === 0) return;
                allPromises.push( col.insertMany(data) );
            }, () => {}, async () => {
                if (allPromises.length !== 0) await Promise.all(allPromises);
                if (prev !== 0) console.log("<Recover FRS DB> Save into DB completed.");
                this.sjRecovered.next(true);
            });

        /// poll from FRS
        let first: RecognizedUser | UnRecognizedUser = null;
        let last: RecognizedUser | UnRecognizedUser = null;
        console.time("<Recover FRS DB> Done load");
        this.fetchAll(lastTimestamp, Number.MAX_SAFE_INTEGER, 20)
            .do( () => ++prev )
            .pipe( filterFace() )
            .subscribe( (data) => {
                let picked = this.makeDBObject(data);
                sjBatchSave.next(picked);
                if (first === null) first = picked as any;
                last = picked as any;
                ++count;
            }, () => {}, () => {
                // console.log('prev', prev, 'total', count);
                if (prev !== 0) {
                    console.log(`from: ${new Date(first.timestamp).toISOString()}, to: ${new Date(last.timestamp).toISOString()}`);
                    console.log(`<Recover FRS DB> ${prev} faces loaded. After remove duplicate, ${count} left.`);
                }
                sjBatchSave.complete();
                console.timeEnd("<Recover FRS DB> Done load");
            });
    }
    private async writeDB() {
        /// read local db
        let col = this.db.collection(collection);

        let sjBatchSave: Subject<any> = new Subject();
        let bsSubscription = sjBatchSave.bufferTime(1000)
            .subscribe( (data: any[]) => {
                if (data.length === 0) return;
                col.insertMany(data);
            });
        
        this.livestream
            .pipe( saveSnapshot(12) )
            .subscribe((data) => {
                let picked = this.makeDBObject(data);
                sjBatchSave.next(picked);
            });
    }
    /////////////////////////////////

    /// private helpers /////////////
    private makeUrl(func: string) {
        const urlbase: string = `http://${Config.frs.ip}:${Config.frs.port}/frs/cgi`;
        return `${urlbase}/${func}`;
    }
    private waitForLogin() {
        return this.sjLogined.getValue() === true ? null :
            this.sjLogined.filter(val => val === true).first().toPromise();
    }
    private waitForRecover() {
        return this.sjRecovered.getValue() === true ? null :
            this.sjRecovered.filter(val => val === true).first().toPromise();
    }
    private makeDBObject(data: RecognizedUser | UnRecognizedUser) {
        let o: any = data;
        // let picked = ((
        //     { type, person_info, person_id, score, snapshot, channel, timestamp, groups, face_feature, highest_score }
        // ) => (
        //     { type, person_info, person_id, score, snapshot, channel, timestamp, groups, face_feature, highest_score }
        // ))(o);
        let picked = ((
            { type, person_id, snapshot, channel, timestamp, face_feature }
        ) => (
            { type, person_id, snapshot, channel, timestamp, face_feature }
        ))(o) as any;
        o.person_info !== undefined && (picked.person_info = o.person_info);
        o.score !== undefined && (picked.score = o.score);
        o.groups !== undefined && (picked.groups = o.groups);
        o.highest_score !== undefined && (picked.highest_score = o.highest_score);
        //picked.face_feature = new Buffer(o.face_feature, 'binary');

        return picked;
    }
    /////////////////////////////////
}

export default new FRSService();
