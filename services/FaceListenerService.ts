import { client as WebSocketClient } from 'websocket';
import cfg from './../config/config';
import { Subject } from 'rxjs';
import * as Parse from 'parse/node';

import { FaceItem, PFace } from './../interfaces/FaceItem';

/// automation const ///
const ignoreLength = cfg.ignoreLength;
const UrlListen = `ws://${cfg.ip}:${cfg.port}/listen`;
const ParamListenCameras = `{sourceid: ${JSON.stringify(cfg.listenCameras)}}`;

var FaceListenerSubject: Subject<FaceItem> = new Subject<FaceItem>();

class FaceListenerService {
    private client: WebSocketClient;
    constructor() {
        var reconnect = () => {
            console.log('error or closed. try reconnect...');
            this.client.connect(UrlListen);
        }
        this.client = new WebSocketClient();
        this.client.on('connectFailed', reconnect);
        this.client.on('connect', (connection) => {
            console.log('connected');
            connection.on('error', reconnect);
            connection.on('close', reconnect);
            connection.on('message', (message) => {
                console.log(`capture face: ${message.utf8Data}`);
                try {
                    var tmp = JSON.parse(message.utf8Data);
                } catch (e) {
                    return;
                }
                var obj: FaceItem = {
                    sourceid: tmp.sourceid,
                    name: tmp.name,
                    groupname: tmp.groupname,
                    image: tmp.image,
                    quality: tmp.quality,
                    facewidth: tmp.facewidth,
                    faceheight: tmp.faceheight,
                    createtime: tmp.createtime
                };
                console.log("captured face: "+JSON.stringify(obj));
                if (obj.facewidth < ignoreLength || obj.faceheight < ignoreLength) return;
                // console.log(`capture face: ${JSON.stringify(obj)}`);

                /// save to Parse
                var pface = new PFace();
                pface.save(obj);

                /// trigger Subject
                FaceListenerSubject.next(obj);
            });
            connection.sendUTF(ParamListenCameras);
        });
        this.client.connect(UrlListen);
    }
}
new FaceListenerService();

export {
    FaceListenerSubject,
}