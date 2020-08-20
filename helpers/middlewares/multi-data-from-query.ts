import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { default as Ast } from 'services/ast-services/ast-client';

interface IMultiDelete {
    objectId: string | string[];
}

interface IResponseMessage {
    statusCode: number;
    objectId: string;
    message: string;
}

export function MultiDataFromQuery(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.inputType = await Ast.requestValidation('IMultiDelete', req.parameters);

            let _objectIds: string[] = [].concat(req.parameters.objectId).filter((n, i, arr) => arr.indexOf(n) === i);

            let resMessages = _objectIds.map<IResponseMessage>((value, index, array) => {
                return {
                    statusCode: 200,
                    objectId: value,
                    message: '',
                };
            });

            req.parameters = { ...req.parameters, resMessages: resMessages, objectIds: _objectIds };
            next();
        } catch (e) {
            return next(e);
        }
    };
}
