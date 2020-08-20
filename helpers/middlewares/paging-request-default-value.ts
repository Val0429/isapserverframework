import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';

export function PagingRequestDefaultValue(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            let _paging: object = req.inputType.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging['page'] || 1;
            let _pageSize: number = _paging['pageSize'] || 10;

            req.inputType = { ...req.inputType, paging: { page: _page, pageSize: _pageSize } };
            next();
        } catch (e) {
            return next(e);
        }
    };
}
