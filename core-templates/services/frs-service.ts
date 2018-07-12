import config from './../../config/custom/frs';
import * as request from 'request';
import * as http from 'http';
import { client } from 'websocket';
import { Observable, Observer } from 'rxjs';
import { Response } from '~express/lib/response';
import { promisify } from 'bluebird';
var faceFeatureCompareWin = require('./../modules/featureCompareWin/build/Release/faceFeatureCompare')();
async function faceFeatureCompare(buffer1, buffer2) {
    return new Promise<any>( (resolve) => {
        faceFeatureCompareWin.faceFeatureCompareAsync( buffer1, buffer2, (score) => {
            resolve(score);
        } );
    });
}

export class FRSService {
    session_id: string;
    constructor() {
        this.login();
    }

    maintainTimer: any;
    logingIn: boolean = false;
    private login() {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/login`;

        var tryLogin = () => {
            if (this.logingIn === true) return;
            this.logingIn = true;

            request({
                url,
                method: 'POST',
                json: true,
                body: { username: config.account, password: config.password }
            }, (err, res, body) => {
                this.logingIn = false;
                if (err || !body) {
                    console.log(`Login FRS Server failed@${config.ip}:${config.port}. Retry in 1 second.`);
                    setTimeout(() => { tryLogin() }, 1000);
                    return;
                }

                console.log(`Login into FRS Server@${config.ip}:${config.port}.`);

                this.session_id = body.session_id;
                /// After login and got session_id, maintain session every 1 minute.
                if (this.maintainTimer) clearInterval(this.maintainTimer);
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
        var me = this;
        return new Promise( (resolve, reject) => {
            const url: string = `http://${config.ip}:${config.port}/frs/cgi/maintainsession`;
            request({
                url,
                method: 'POST',
                json: true,
                body: { session_id: this.session_id }
            }, (err, res, body) => {
                /// maintain success { message: 'Unauthorized.' }
                if (!body || body.message === 'Unauthorized.') {
                    console.log(`Maintain FRS session failed@${config.ip}:${config.port}.`);
                    resolve(false);
                    me.login();
                    return;
                }
                console.log('maintain success', body);
                resolve(true);
            });

        });
    }

    private compareFace(image_1: string, image_2: string): Promise<number> {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/compareface`;
        return new Promise((resolve, reject) => {
            request({
                url,
                method: 'POST',
                json: true,
                body: { session_id: this.session_id, image_1, image_2 }
            }, (err, res, body) => {
                if (err) {
                    console.log(`FRS compare face failed.`, err);
                    reject(err); return;
                }
                if (body.score === undefined) { reject(body); return; }
                resolve(body.score);
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
                    console.log("Connection Error", err);
                    setTimeout( () => reconnect() );
                });
                connection.on('close', () => {
                    console.log("Connection Closed");
                    setTimeout( () => reconnect() );
                });
                connection.on('message', (message) => {
                    var data = eval(`(${message.utf8Data})`);
                    //console.log('message', message.utf8Data);
                    if ((<any>data).code) {
                        if (<any>data.code === 401) {
                            me.login();
                            return;
                        }
                        console.log('message', data);
                        return;
                    }
                    callback && callback(data);
                });
                connection.sendUTF(JSON.stringify({
                    "session_id": this.session_id
                }));
            });
            cli.on('connectFailed', (err) => {
                console.log("Connect Error: ", err);
                    setTimeout( () => reconnect() );
            });
            cli.connect(url, 'echo-protocol');
        }

        const url: string = `ws://${config.ip}:${config.wsport}/frs/ws/fcsreconizedresult`;
        const urlnon: string = `ws://${config.ip}:${config.wsport}/frs/ws/fcsnonreconizedresult`;
        makeConnection.call(this, url, (data: RecognizedUser) => {
            // console.log('recognized result', data);
            sjRecognizedUser.next({type: 'recognized', ...data});
        });
        makeConnection.call(this, urlnon, (data: NonRecognizedUser) => {
            // console.log('nonrecognized result', data);
            sjNonRecognizedUser.next({type: 'nonrecognized', ...data});
        });
    }

    snapshot(image: string, resp: Response): Promise<void> {
        return new Promise<void>( (resolve, reject) => {
            var url: string = `http://${config.ip}:${config.port}/frs/cgi/snapshot/session_id=${this.session_id}&image=${image}`;
            request({
                url,
                method: 'GET',
                encoding: null
            }, (err, res, body) => {
                //console.log(err, res, body);
                resp.setHeader("content-type", res.headers["content-type"]);
                resp.end(body, "binary");
                resolve();
            });
        });
    }

    lastImages(): Subject<RecognizedUser | NonRecognizedUser> {
        var now = Date.now();
        var hours = 60*60*1000;
        return this.search(null, now-8*hours, now);
    }

    search(face: RecognizedUser | NonRecognizedUser, starttime: number, endtime: number): Subject<RecognizedUser | NonRecognizedUser> {
        var sj = new Subject<RecognizedUser | NonRecognizedUser>();

        (async () => {

        const url: string = `http://${config.ip}:${config.port}/frs/cgi/getverifyresultlist`;
        const urlnon: string = `http://${config.ip}:${config.port}/frs/cgi/getnonverifyresultlist`;

        /// get back face feature!
        let faceFeature;
        let faceBuffer;
        if (face) {
            faceFeature = face.face_feature;
            if (!faceFeature) {
                var vurl = face.type === 'recognized' ? url : urlnon;
                var backs = await poll.call(this, face.timestamp, face.timestamp, vurl).toPromise();
                for (var person of backs) {
                    if (person.snapshot === face.snapshot) {
                        faceFeature = person.face_feature;
                        break;
                    }
                }
            }
            faceBuffer = new Buffer(faceFeature, 'binary');
        }


        function poll(starttime: number, endtime: number, url: string, page: number = 0): Observable<RecognizedUser[] | NonRecognizedUser[]> {
            function doRequest(observer: Observer<any>, page: number = 0)  {
                let bodyparam = { session_id: this.session_id, start_time: starttime, end_time: endtime, page_size : 20, skip_pages: page };
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

        var recog = { timestamp: 0, finished: false, data: [] };
        var nonrecog = { timestamp: 0, finished: false, data: [] };
        var queue = [];

        async function queueHandler() {
            /// 1) if passin face is recognized, or no face, return all.
            if (!face || face.type === 'recognized') {
                while (queue.length > 0) {
                    var data = queue[0];
                    // console.log(data.type, data.timestamp);
                    sj.next( queue.shift() );
                }
                if (recog.finished && nonrecog.finished)
                    sj.complete();

            } else {
            /// 2) if passin face is nonrecognized, return recognized, compare all nonrecognized.
                while (queue.length > 0) {
                    var data = queue.shift();
                    if (data.type === 'recognized') {
                        sj.next( data );
                        continue;
                    }

                    var buffer = new Buffer(data.face_feature, 'binary');
                    // var score = faceFeatureCompareWin.faceFeatureCompare( faceBuffer, buffer );
                    var score = await faceFeatureCompare( faceBuffer, buffer );
                    data.score = +eval(`(${score}).score`);
                    sj.next( data );
                }
            }
        }

        function prepareQueue(recognizeBase: boolean) {
            var base = recognizeBase ? recog : nonrecog;
            var ref = recognizeBase ? nonrecog : recog;
            if (base.data.length === 0) return;
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

        /// handle response
        var obRecog = poll.call(this, starttime, endtime, url);
        obRecog.subscribe({
                next: (data: RecognizedUser[]) => {
                    recog.timestamp = data[data.length-1].timestamp;
                    data.forEach( (value: RecognizedUser) => value.type = 'recognized' );
                    recog.data.push.apply(recog.data, data);
                    prepareQueue(true);
                },
                complete: () => {
                    recog.finished = true;
                    prepareQueue(true);
                }
            });
        var obNonRecog = poll.call(this, starttime, endtime, urlnon);
        obNonRecog.subscribe({
                next: (data: NonRecognizedUser[]) => {
                    nonrecog.timestamp = data[data.length-1].timestamp;
                    data.forEach( (value: NonRecognizedUser) => value.type = 'nonrecognized' );
                    nonrecog.data.push.apply(nonrecog.data, data);
                    prepareQueue(false);
                },
                complete: () => {
                    nonrecog.finished = true;
                    prepareQueue(false);
                }
            });

        Observable.forkJoin(obRecog, obNonRecog)
            .subscribe( () => {
                /// combine last
                var final = [ ...recog.data, ...nonrecog.data ].sort( (a, b) => a.timestamp - b.timestamp );
                queue.push.apply(queue, final);
                queueHandler();
                ///queue.forEach( (data) => console.log(data.type, data.timestamp) );
            });

        })();            

        return sj;
    }

}

import { Subject } from 'rxjs';
var sjRecognizedUser = new Subject<RecognizedUser>();
var sjNonRecognizedUser = new Subject<NonRecognizedUser>();
export { sjRecognizedUser, sjNonRecognizedUser };

export interface RecognizedUser {
    type: "recognized",
    person_info: {
        fullname: string;
        employeeno: string;
    }
    last_recognized: {
        timestamp: number;
        face_id_number: string;
    }
    person_id: string;
    score: number;
    target_score: number;
    snapshot: string;
    channel: string;
    timestamp: number;
    verify_face_id: string;
    action_enable: number;
    request_client_param: string;
    groups: string[];
    face_feature: string;
}

export interface NonRecognizedUser {
    type: "nonrecognized",
    target_score: number;
    snapshot: string;
    channel: string;
    timestamp: number;
    verify_face_id: string;
    action_enable: number;
    request_client_param: string;
    highest_score: {
        fullname: string;
        face_id_number: string;
        score: number;
    }
    face_feature: string;
    /**
     * score: add feature. only /search will have score.
     */
    score?: number;
}

export default new FRSService();