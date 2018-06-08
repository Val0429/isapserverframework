import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful,
} from './../../../core/cgi-package';

import { Floors, IFloors } from './../../custom/models/floors';

//import * as csv from 'fast-csv';
import * as parseCsv from 'node-csv-parse';

export interface InputPost {
    sessionId: string;
    data: string;
}

var action = new Action<InputPost>({
    loginRequired: true,
    postSizeLimit: 1024*1024*10,
    permission: [RoleList.Administrator, RoleList.Kiosk]
})
.post( async (data) => {
    var content = new Buffer(data.parameters.data, 'base64').toString();
    var result = parseCsv(content);

    var floors: Floors[] = result.asObjects()
        .reduce( (final, value) => {
            do {
                if (!value.floor || !value.name) break;
                final.push(new Floors({
                    floor: +value.floor,
                    unitNo: value.unitNo,
                    name: value.name,
                    phone: value.phone.split(",")
                }));
            } while(0);
            return final;
        }, []);

    await Parse.Object.saveAll(floors);
    
    return;
});

export default action;