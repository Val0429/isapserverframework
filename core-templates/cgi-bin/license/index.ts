/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';
import * as request from 'request';
import licenseService from 'services/license';
import { promisify } from 'bluebird';
var getMac = require('getmac').getMac;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: add license
 ********************************/
interface InputC {
    keyOrData: string;
}

action.post<InputC>({ inputType: "InputC" }, async (data) => {
    let { keyOrData: key } = data.inputType;
    if (key.length === 29) {
        let mac: string = await promisify(getMac)() as string;
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

    return "";
});

/********************************
 * R: get license
 ********************************/
action.get( async (data) => {
    let xml = await licenseService.getLicense();
    let rtn = await Restful.Pagination(xml.licenses, data.parameters);
    (rtn as any).summary = xml.summary;
    return rtn;
});
/// CRUD end ///////////////////////////////////

export default action;
