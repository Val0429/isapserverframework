import { Log } from 'helpers/utility';
import { FileHelper } from 'core/cgi-package';
let qrcode = require('qrcode');

interface IQRCodeOptions {
    /**
     * valid type: image/png, image/jpeg, image/webp
     */
    type: string;

}

export class QRCode {
    make(data: string, options?: IQRCodeOptions): Promise<Parse.File> {
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
