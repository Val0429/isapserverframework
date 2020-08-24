/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as Express from 'express';
import * as Fs from 'fs';
import * as Path from 'path';
import * as Readline from 'readline';
import { Action } from 'helpers/cgi-helpers/core';
import { autoPad } from 'helpers/shells/shell-writer';
import { blockingKey, blockingException } from './router-block';

const DefaultPath = 'index';
const HiddenPath = '__api__';

export let actions: Action[] = [];

/**
 * Router Loader
 * @param app Express.Application
 * @param cgiPaths string[]
 * @param cgiPrefixPath string
 * @returns Action[]
 */
export function RouterLoader(app: Express.Application, cgiPaths: string[], cgiPrefixPath: string): Action[] {
    try {
        let actionUriDirectory = {};
        for (let cgiPath of cgiPaths) {
            actionUriDirectory = GetActions(actionUriDirectory, cgiPath, cgiPrefixPath);
        }

        if (Object.keys(actionUriDirectory).length > 0) {
            Readline.cursorTo(process.stdout, 0);
            Readline.clearLine(process.stdout, 0);
        }

        actions = Object.keys(actionUriDirectory)
            .map((n) => actionUriDirectory[n])
            .sort((a, b) => {
                let aUri: string = a.uri;
                let aUriName: string = aUri.substr(aUri.lastIndexOf('/') + 1);
                let aUriPath: string = aUri.substr(0, aUri.lastIndexOf('/'));

                let bUri: string = b.uri;
                let bUriName: string = bUri.substr(bUri.lastIndexOf('/') + 1);
                let bUriPath: string = bUri.substr(0, bUri.lastIndexOf('/'));

                if (aUriPath === bUriPath) {
                    if (aUriName === DefaultPath) {
                        return -1;
                    } else if (bUriName === DefaultPath) {
                        return 1;
                    } else if (aUriName === bUriName) {
                        return 0;
                    } else if (aUriName > bUriName) {
                        return 1;
                    } else {
                        return -1;
                    }
                } else if (aUriPath > bUriPath) {
                    return 1;
                } else {
                    return -1;
                }
            });

        let router = Express.Router();

        let routings: string[] = [];
        for (let action of actions) {
            let _routings: string[] = action.uri.substr(1).split('/');

            for (let i: number = 0; i < _routings.length - 1; i++) {
                if (routings[i] === _routings[i]) continue;

                PrintChild(`${_routings[i]}`, [], true, i);
            }

            routings = _routings;

            let uri: string = action.uri;
            let uriPath: string = uri.substr(0, uri.lastIndexOf('/'));
            let uriName: string = uri.substr(uri.lastIndexOf('/') + 1);
            if (uriName === DefaultPath) {
                router.use(new RegExp(`^${uriPath}(/(${DefaultPath}/?)?)?$`, 'i'), action.mount());
            } else {
                router.use(`${action.uri}`, action.mount());
            }

            let types = GetTypesFromAction(action);

            PrintChild(uriName, types, false, _routings.length - 1);
        }

        app.use(router);

        return actions;
    } catch (e) {
        throw e;
    }
}

/**
 * Get Action List
 * @param actionUriDirectory object
 * @param cgiPath string
 * @param cgiPrefixPath string
 * @param breadcrumbs string
 * @param level number
 * @returns object
 */
function GetActions(actionUriDirectory: object, cgiPath: string, cgiPrefixPath: string): object;
function GetActions(actionUriDirectory: object, cgiPath: string, cgiPrefixPath: string, breadcrumbs: string, level: number): object;
function GetActions(actionUriDirectory: object, cgiPath: string, cgiPrefixPath: string, breadcrumbs?: string, level?: number): object {
    try {
        breadcrumbs = breadcrumbs === null || breadcrumbs === undefined ? '' : breadcrumbs;
        level = level === null || level === undefined ? 0 : level;

        if (!Fs.existsSync(cgiPath)) {
            return actionUriDirectory;
        }

        let name = Path.parse(cgiPath).name;
        if (name === HiddenPath) {
            return actionUriDirectory;
        }

        if (level === 0 && blockingKey && blockingKey.test(name)) {
            if (name !== blockingException) {
                return actionUriDirectory;
            }
        }

        if (Fs.lstatSync(cgiPath).isDirectory()) {
            let files = Fs.readdirSync(cgiPath);

            for (let file of files) {
                let callPath = level === 0 ? '' : `${breadcrumbs}/${name}`;
                GetActions(actionUriDirectory, `${cgiPath}/${file}`, cgiPrefixPath, callPath, level + 1);
            }
        } else {
            let action: Action = LoadRouteFromPath(cgiPath);
            if (!action) {
                return;
            }

            Readline.clearLine(process.stdout, 0);
            process.stdout.write(`\x1b[90mload '${action.caller}' success\x1b[0m`);
            Readline.cursorTo(process.stdout, 0);

            if (action instanceof Action) {
                action.uri = `${breadcrumbs}${name ? `/${name}` : ''}`;
                actionUriDirectory[action.uri] = action;
            }
        }

        return actionUriDirectory;
    } catch (e) {
        throw e;
    }
}

/**
 * Load Route From Path
 * @param path string
 * @returns Action
 */
function LoadRouteFromPath(path: string): Action {
    try {
        let ext = Path.extname(path).toLowerCase();
        if (!ext) {
            ext = '.ts';
            path += '.ts';
        }
        if (ext !== '.ts' || !Fs.existsSync(path)) {
            return null;
        }

        let action: Action = require(`${path}`).default;
        if (!action) {
            throw `${path} has no default export.`;
        }

        return action;
    } catch (e) {
        throw e;
    }
}

/**
 * Get Types From Action
 * @param action Action
 * @returns string[]
 */
function GetTypesFromAction(action: Action): string[] {
    try {
        if (!action) {
            return null;
        }

        let types = [];
        let protos = ['All', 'Get', 'Post', 'Put', 'Delete', 'Ws'];
        for (let proto of protos) {
            if (!!action[`func${proto}`]) {
                types.push(proto.toUpperCase());
            }
        }

        return types;
    } catch (e) {
        throw e;
    }
}

/**
 * Print Child
 * @param name string
 * @param types string[]
 * @param isFolder boolean
 * @param level number
 */
function PrintChild(name: string, types: string[], isFolder: boolean, level: number): void {
    try {
        if (isFolder) {
            let msg = ['\x1b[1m\x1b[32m', autoPad(`/${name}`, 3 * level), '\x1b[0m'];
            if (!!types && types.length > 0) {
                msg = [...msg.slice(0, msg.length - 1), `(${types.join(', ')})`];
            }

            console.log(...msg, '\x1b[0m');
        } else {
            if (!!name) {
                console.log('\x1b[33m', autoPad(`--> ${name}`, 3 * level), types.length == 0 ? '' : `(${types.join(', ')})`, '\x1b[0m');
            }
        }
    } catch (e) {
        throw e;
    }
}
