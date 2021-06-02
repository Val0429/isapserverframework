import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { default as Ast } from 'services/ast-services/ast-client';

interface IMultiData {
    datas: any[];
}

interface IResponseMessage {
    statusCode: number;
    objectId: string;
    message: string;
}

export function MultiDataFromBody(): RequestHandler {
    return async function MultiDataFromBody(req: Request, res: Response, next: NextFunction) {
        try {
            req.inputType = await Ast.requestValidation('IMultiData', req.parameters);

            let resMessages = (req.parameters.datas as any[]).map<IResponseMessage>((value, index, array) => {
                return {
                    statusCode: 200,
                    objectId: value.objectId || '',
                    message: '',
                };
            });

            req.parameters = { ...req.parameters, resMessages: resMessages };
            next();
        } catch (e) {
            return next(e);
        }
    };
}
