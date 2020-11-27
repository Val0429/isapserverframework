import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { PrintService, FileService } from 'helpers';
import { BasicAuth } from 'helpers/middlewares';
import * as Permission from 'workspace/define/userRoles/userPermission.define';
import * as ChildProcess from 'child_process';

let action = new Action({});

export default action;

/**
 * Action Post
 */
type InputC = null;

type OutputC = string;

action.post(
    {
        loginRequired: true,
        permission: [RoleList.SystemAdministrator],
    },
    async (data): Promise<OutputC> => {
        try {
            PrintService.log('Container Bye', new Error(), 'info');

            setTimeout(() => {
                try {
                    let filename = FileService.realPath('kill-self.sh');
                    if (!FileService.getFileAlive(filename)) {
                        process.exit(1);
                    } else {
                        ChildProcess.execSync(filename, { stdio: 'inherit' });
                    }
                } catch (e) {
                    PrintService.log(e, new Error(), 'error');
                }
            }, 0);

            return 'bye';
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Action Get
 */
type InputR = null;

type OutputR = string;

action.get(
    {
        loginRequired: false,
        middlewares: [BasicAuth(Permission['permissionServerByeR'])],
    },
    async (data): Promise<OutputR> => {
        try {
            PrintService.log('Container Bye', new Error(), 'info');

            setTimeout(() => {
                try {
                    let filename = FileService.realPath('kill-self.sh');
                    if (!FileService.getFileAlive(filename)) {
                        process.exit(1);
                    } else {
                        ChildProcess.execSync(filename, { stdio: 'inherit' });
                    }
                } catch (e) {
                    PrintService.log(e, new Error(), 'error');
                }
            }, 0);

            return 'bye';
        } catch (e) {
            throw e;
        }
    },
);
