var edge = require('edge-js');
import { promisify } from 'bluebird';
import * as fs from 'fs';
import { Log } from 'helpers/utility';
import { BehaviorSubject } from 'rxjs';
import { file } from 'tmp-promise';

const dllPath: string = `${__dirname}/lib/LibFaceDetection.dll`;

let Detect: any = promisify(edge.func({
    assemblyFile: dllPath,
    typeName: 'LibFaceDetection.Startup',
    methodName: 'Detect'
}));

interface IDetectArea {
    coordinate: [number, number, number, number];
    eye_distance: number;
    posid: number;
}
interface IDetect {
    faces: number,
    face_list: IDetectArea[]
}

export class FaceDetectionService {
    async detect(pathOrBase64: string): Promise<IDetect> {
        let path, result;
        if (pathOrBase64.length <= 1024) {
            path = pathOrBase64;
            result = JSON.parse(await Detect({ path }));
        } else {
            const { fd, path, cleanup } = await file();
            await new Promise( (resolve) => {
                fs.writeFile(path, Buffer.from(pathOrBase64, 'base64'), "binary", (err) => { resolve() })
            });
            result = JSON.parse(await Detect({ path }));
            cleanup();
        }
        return result;
    }
}

export default new FaceDetectionService();
