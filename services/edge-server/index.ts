import * as request from 'request';
import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { Log } from 'helpers/utility';
import { LogTitle, IFRSEdgeServerConfig, RequestLoginReason } from './libs/core';
import { Config } from 'core/config.gen';
import ConfigManager from 'helpers/shells/config-manager';

/**
 * Submodules should take this into consideration:
 * 1) sjLogined
 * 2) sjStarted
 * 3) config.debug
 * 4) when request failed do retry
 * 5) timeout handle
 */

export class FRSEdgeServer {
    private sessionId: string;
    /// started or not
    private sjStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    /// login or not
    private sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    /// request for relogin
    private sjRequestLogin: Subject<RequestLoginReason> = new Subject<RequestLoginReason>();
    private config: IFRSEdgeServerConfig;
    static initializer: ((this: FRSEdgeServer) => void)[] = [];

    /// use for fixed config frs
    private static _sharedInstance: FRSEdgeServer;
    static async sharedInstance(): Promise<FRSEdgeServer> {
        await ConfigManager.ready("frs");
        if (this._sharedInstance) return this._sharedInstance;
        this._sharedInstance = new FRSEdgeServer({
            debug: true,
            frsEdge: Config.frs
        });
        this._sharedInstance.start();
        return this._sharedInstance;
    }

    constructor(config: IFRSEdgeServerConfig) {
        this.initial(config);
    }

    private snInitial: Subscription;
    initial(config: IFRSEdgeServerConfig) {
        this.config = config;
        /// initialize
        FRSEdgeServer.initializer.forEach( (init) => init.call(this) );

        if (this.snInitial) {
            this.snInitial.unsubscribe();
            this.snInitial = null;
        }
        this.snInitial = this.sjRequestLogin.subscribe( (reason) => {
            if (this.config.debug) {
                switch (reason) {
                    case RequestLoginReason.SessionExpired:
                        Log.Error(LogTitle, `Session expired. Mostly because of being logout (with account <${this.config.frsEdge.account}>).`);
                        break;
                    default:
                        Log.Error(LogTitle, "Request to login again. (Unknown Error)");
                        break;
                }
            }
            this.login();
        });
    }

    start() {
        this.config.debug && Log.Info(LogTitle, "Started.");
        this.sjStarted.next(true);
        this.login();
    }

    stop() {
        this.sjStarted.next(false);
        this.sjLogined.next(false);
        this.sjLoggingIn.next(false);
        this.config.debug && Log.Info(LogTitle, "Stopped.");
        if (this.snInitial) {
            this.snInitial.unsubscribe();
            this.snInitial = null;
        }
    }

    /// private helpers /////////////////////
    private makeUrl(func: string) {
        let { ip, port, ssl } = this.config.frsEdge;
        const urlbase: string = `http${ssl?'s':''}://${ip}:${port}`;
        return `${urlbase}/${!func ? "" : func}`;
    }
    public waitForSubject(target: BehaviorSubject<boolean>): Promise<boolean> {
        return target.getValue() === true ? null :
            target.filter(val => val === true).first().toPromise();
    }
    public waitForLogin() {
        return this.waitForSubject(this.sjLogined);
    }
    
    /// private functions ///////////////////
    /// prevent multiple login process
    private sjLoggingIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private maintainTimer: any = null;
    private login() {
        if (this.sjStarted.getValue() === false) return;

        let tryLogin = () => {
            const url = this.makeUrl("user/web/login");
            if (this.sjLoggingIn.getValue() === true || this.sjStarted.getValue() === false) return;
            this.sjLogined.next(false);
            this.sjLoggingIn.next(true);

            let { ip, port, account: username, password } = this.config.frsEdge;

            request({
                url, method: 'POST', json: true,
                headers: { "content-type": "application/json" },
                body: { username, password }
            }, async (err, res, body) => {
                this.sjLoggingIn.next(false);
                if (err ||
                    (res && res.statusCode !== 200)
                    ) {
                    let started = this.sjStarted.getValue();
                    let logined = this.sjLogined.getValue();
                    !logined && this.config.debug && Log.Error(LogTitle, `Login failed@${ip}:${port}. ${started ? "Retry in 1 second." : ""}`);
                    if (started && !logined) {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        if (!logined) process.nextTick(tryLogin);
                    }
                    return;
                }
                this.config.debug && Log.Info(LogTitle, `Login into Server@${ip}:${port}.`);
                this.sessionId = body.sessionId;

                this.sjLogined.next(true);
            });
        }
        tryLogin();
    }
}

import './modules/verify-face';
import './modules/person';
