/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Log } from 'helpers/utility';
import { FileHelper } from 'helpers/parse-server/file-helper';
let qrcode = require('qrcode');

interface IQRCodeOptions {
    /**
     * valid type: image/png, image/jpeg, image/webp
     */
    type: string;

}

export class QRCode {
    static make(data: string, options?: IQRCodeOptions): Promise<Parse.File> {
        return new Promise( (resolve, reject) => {
            qrcode.toDataURL(data, async (err, url) => {
                if (err) return reject(err);
                let file: Parse.File = await FileHelper.toParseFile(url) as Parse.File;
                resolve(file);
            });
        });
    }
}

export default new QRCode();
