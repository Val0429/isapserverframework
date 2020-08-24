import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { FileService } from 'helpers';
import { BasicAuth } from 'helpers/middlewares';
import * as Permission from 'workspace/define/userRoles/userPermission.define';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Get Server Version
 */
type InputR = null;

type OutputR = string;

action.get(
    {
        middlewares: [BasicAuth(Permission['permissionServerChangeLogR'])],
    },
    async (data): Promise<OutputR> => {
        try {
            let filename: string = 'workspace/change.log';
            if (!FileService.getFileAlive(filename)) {
                return '';
            }

            let file: Buffer = FileService.readFile(filename);
            let log: string = file.toString();
            let logs: string[] = log.replace(/\r/g, '').split(/\n/);

            let logVersonDirectory: object = {};
            for (let i: number = 0, key: string = ''; i < logs.length; i++) {
                let log: string = logs[i];

                let match: RegExpMatchArray = log.match(/message: v[0-9].[0-9]{2}.[0-9]{2}$/);
                if (!!match && match.length > 0) {
                    key = match[0].replace(/message: /, '');
                    logVersonDirectory[key] = '';
                    continue;
                }

                if (!key) continue;

                logVersonDirectory[key] += `<li>${log}</li>`;
            }

            let html: string = '';
            Object.keys(logVersonDirectory).forEach((value, index, array) => {
                let key = value;
                let list = logVersonDirectory[value];

                html += `
                    <div>
                        <h2 style='margin:0px'>${key}</h2>
                        <ul style='margin-top:0.5rem'>${list}<ul>
                    </div>`;
            });

            return html;
        } catch (e) {
            throw e;
        }
    },
);
