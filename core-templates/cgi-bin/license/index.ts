/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, LICENSE_KEY,
} from 'core/cgi-package';
import * as request from 'request';
import * as fs from 'fs';
import * as path from 'path';
import licenseService from 'services/license';
import { promisify } from 'bluebird';
import { Log } from 'helpers/utility';
var getMac = require('getmac').getMac;

var action = new Action({
    loginRequired: false,
});

/// CRUD start /////////////////////////////////
/********************************
 * C: add license
 ********************************/
interface InputC {
    mac?: string;
    keyOrData: string;
}

action.post<InputC>({ inputType: "InputC" }, async (data) => {
    let { keyOrData: key, mac } = data.inputType;
    /// regularize
    if (mac) mac = mac.replace(/\:/g, "-").toUpperCase();

    try {
        if (key.length === 29) {
            if (!mac) mac = await promisify(getMac)() as string;
            /// 1) online license 29 digits
            /// 1.1) VerifyLicenseKey
            let res1: number = await licenseService.verifyLicenseKey({key});
            if (res1 <= 0) throw Errors.throw(Errors.CustomBadRequest, ["License invalid."]);
            /// 1.2) send online url
            let url = `http://www.isapsolution.com/register.aspx?L=${key}&M=${mac}`;
            let res2: string = await new Promise( (resolve, reject) => {
                request({
                    url,
                    method: 'POST'
                }, (err, res, body) => {
                    if (err) throw err;
                    resolve(body);
                });
            }) as string;
            /// 1.2.1) If there are 'ERROR' inside body, throw
            if (/^ERROR/.test(res2)) throw Errors.throw(Errors.CustomBadRequest, [`License Invalid: ${res2}`]);
            /// 1.3) AddLicense
            await licenseService.addLicense({ xml: res2 });
    
        } else {
            /// 2) offline register
            /// 2.1) VerifyLicenseXML
            let res3: boolean = await licenseService.verifyLicenseXML({xml: key}) as boolean;
            if (res3 === false) throw Errors.throw(Errors.CustomBadRequest, ["License invalid."]);
            /// 2.2) AddLicense
            await licenseService.addLicense({ xml: key });
        }
    } catch(e) {
        if (e instanceof Errors) throw e;
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }

    return "";
});

/********************************
 * R: get license
 ********************************/
action.get( async (data) => {
    let xml = await licenseService.getLicense();
    let rtn = await Restful.Pagination(xml.licenses, data.parameters);
    (rtn as any).summary = xml.summary;
    (rtn as any).productKey = LICENSE_KEY;
    return rtn;
});

/********************************
 * D: delete license
 ********************************/
action.delete( async (data) => {
    /// remove two places of licenses
    let path1 = path.resolve(__dirname, "./../../custom/license/license.xml");
    let path2 = path.resolve(__dirname, "./../../custom/assets/license.xml");
    fs.existsSync(path1) && fs.unlinkSync(path1);
    fs.existsSync(path2) && fs.unlinkSync(path2);
    Log.Info("License", "License Removed.");
    return "";
});
/// CRUD end ///////////////////////////////////

export default action;
