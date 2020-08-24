import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { FileService, DateTimeService } from 'helpers';
import { BasicAuth } from 'helpers/middlewares';
import { permissionLogR } from 'workspace/define/userRoles/userPermission.define';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Get
 */
type InputR = null;

type OutputR = string;

action.get(
    {
        middlewares: [BasicAuth(permissionLogR)],
    },
    async (data): Promise<OutputR> => {
        try {
            let logs: string[] = FileService.readFolder('workspace/custom/assets/logs');

            let logDateDirectory: object = {};
            logs.forEach((value, index, array) => {
                if (/^\d{14}.*$/.test(value)) {
                    let key: string = value.substr(0, 14);
                    let date = DateTimeService.toDate(key, 'YYYYMMDDHHmmss');
                    if (date.toString() !== 'Invalid Date') {
                        if (!logDateDirectory[key]) logDateDirectory[key] = [];
                        logDateDirectory[key].push(value);
                    }
                }
            });

            let html: string = '';
            Object.keys(logDateDirectory).forEach((value, index, array) => {
                let list = NatSort(
                    logDateDirectory[value].map((n) => {
                        return {
                            key: n,
                            data: n.replace(`${value}-`, ''),
                        };
                    }),
                ).map((n) => {
                    let name: string = n.data.replace(/\.log$/, '');
                    return `<li><a href='/logs/${value}-${n.data}'>${name}</a></li>`;
                });

                let date = DateTimeService.toDate(value, 'YYYYMMDDHHmmss');

                html = `
                    <div>
                        <h2 style='margin:0px'>${DateTimeService.toString(date, 'YYYY/MM/DD HH:mm:ss')}</h2>
                        <ul style='margin-top:0.5rem'>${list.join('')}<ul>
                    </div>
                    ${html}`;
            });

            return html;
        } catch (e) {
            throw e;
        }
    },
);

/**
 *
 */
export interface ISortData {
    key: any;
    data: string;
}
interface ISortAnalysis extends ISortData {
    datas: number[];
}
/**
 * Natural sort
 * @param sources
 */
export function NatSort(sources: ISortData[]): ISortData[] {
    let analysis: ISortAnalysis[] = sources.map((value, index, array) => {
        let datas: string[] = value.data.match(/\d+/g) || [];
        return {
            key: value.key,
            data: value.data,
            datas: datas.map(Number),
        };
    });

    // analysis = analysis.sort((a, b) => {
    //     let length: number = Math.max(a.datas.length, b.datas.length);
    //     for (let i: number = 0; i < length; i++) {
    //         let v1: number = a.datas[i] || -1;
    //         let v2: number = b.datas[i] || -1;

    //         let result: number = v1 - v2;
    //         if (result !== 0) {
    //             return result;
    //         }
    //     }

    //     return 0;
    // });

    return analysis.map((vlaue, index, array) => {
        return {
            key: vlaue.key,
            data: vlaue.data,
        };
    });
}
