import { config } from './../config/custom/frs';
import * as request from 'request';
import * as http from 'http';

export class FRSService {
    session_id: string;
    constructor() {
        this.login();
    }

    login() {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/login`;
        request({
            url,
            method: 'POST',
            json: true,
            body: { username: config.account, password: config.password }
        }, (err, res, body) => {
            this.session_id = body.session_id;

            /// After login and got session_id, maintain session every 1 minute.
            setInterval( () => {
                this.maintainSession();
            }, 60000);
        });
    }
    
    maintainSession() {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/maintainsession`;
        request({
            url,
            method: 'POST',
            json: true,
            body: { session_id: this.session_id }
        }, (err, res, body) => {
            // console.log('maintain success', body);
        });
    }

}

export default new FRSService();