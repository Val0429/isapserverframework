import { config } from './../../config/custom/frs';
import * as request from 'request';
import * as http from 'http';

export class FRSService {
    session_id: string;
    constructor() {
        this.login();
    }

    login() {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/login`;

        var tryLogin = () => {
            request({
                url,
                method: 'POST',
                json: true,
                body: { username: config.account, password: config.password }
            }, (err, res, body) => {
                if (err) {
                    console.log(`Login FRS Server failed@${config.ip}:${config.port}. Retry in 1 second.`);
                    setTimeout(() => { tryLogin() }, 1000);
                    return;
                }
                console.log(`Login into FRS Server@${config.ip}:${config.port}.`);

                this.session_id = body.session_id;
                /// After login and got session_id, maintain session every 1 minute.
                setInterval( () => {
                    this.maintainSession();
                }, 60000);
            });
        }
        tryLogin();
    }
    
    maintainSession() {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/maintainsession`;
        request({
            url,
            method: 'POST',
            json: true,
            body: { session_id: this.session_id }
        }, (err, res, body) => {
            if (err) {
                console.log(`Maintain FRS session failed@${config.ip}:${config.port}.`);
            }
            // console.log('maintain success', body);
        });
    }

    compareFace(image_1: string, image_2: string): Promise<number> {
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
                    return reject(err);
                }
                resolve(body.score);
            });
        });
    }

}

export default new FRSService();