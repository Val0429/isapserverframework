import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import * as CryptCore from 'crypt-core';

var action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = Buffer;

action.get(
    {},
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        try {
            let buffer: Buffer = CryptCore.iSap1.getSystemInfoEncrypted();

            data.response.contentType('application/octet-stream');

            return buffer;
        } catch (e) {
            throw e;
        }
    },
);
