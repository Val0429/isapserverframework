import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest } from 'models/request';
import { IResponse } from 'models/response';
import { FileService } from 'helpers';
import { License } from 'helpers/license';
import * as Middleware from 'helpers/middlewares';
import * as HttpClient from 'request';
import licenseService from 'services/license';

var action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
interface IIndexC_Key {
    key: string;
    mac: string;
}
interface IIndexC_Data {
    data: string;
}

type InputC = IIndexC_Key | IIndexC_Data;

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.SystemAdministrator],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        try {
            if ('key' in _input && 'mac' in _input) {
                let res1: number = await licenseService.verifyLicenseKey({ key: _input.key });
                if (res1 <= 0) {
                    throw Errors.throw(Errors.CustomBadRequest, ['License invalid.']);
                }

                let url = `http://www.isapsolution.com/register.aspx?L=${_input.key}&M=${_input.mac.replace(/:/g, '-')}`;
                let res2: string = await new Promise<string>((resolve, reject) => {
                    try {
                        HttpClient.post(
                            {
                                url: url,
                            },
                            (error, response, body) => {
                                if (error) {
                                    return reject(error);
                                } else if (response.statusCode !== 200) {
                                    return reject(
                                        `${response.statusCode}, ${body
                                            .toString()
                                            .replace(/\r\n/g, '; ')
                                            .replace(/\n/g, '; ')}`,
                                    );
                                } else if (/^ERROR/.test(body)) {
                                    return reject(Errors.throw(Errors.CustomBadRequest, [`License Invalid: ${body}`]));
                                }

                                resolve(body);
                            },
                        );
                    } catch (e) {
                        return reject(e);
                    }
                }).catch((e) => {
                    throw e;
                });

                await licenseService.addLicense({ xml: res2 });
            } else {
                let res3: boolean = (await licenseService.verifyLicenseXML({ xml: _input.data })) as boolean;
                if (res3 === false) {
                    throw Errors.throw(Errors.CustomBadRequest, ['License invalid.']);
                }

                await licenseService.addLicense({ xml: _input.data });
            }

            FileService.copyFile('workspace/custom/license/license.xml', 'workspace/custom/assets/license/license.xml');

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<License.ILicense>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue()],
        permission: [RoleList.SystemAdministrator],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _paging: IRequest.IPaging = _input.paging;

        try {
            let license = new License();

            let results = await license.GetLicenses();

            let total: number = results.length;
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let pageStart: number = (_paging.page - 1) * _paging.pageSize;
            let pageEnd: number = pageStart + _paging.pageSize;
            results = results.slice(pageStart, pageEnd);

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: results,
            };
        } catch (e) {
            throw e;
        }
    },
);
