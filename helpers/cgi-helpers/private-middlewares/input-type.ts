/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { RoleList } from 'core/userRoles.gen';
import { Errors } from 'core/errors.gen';
import ast from './../../../services/ast-services/ast-client';

/// requiredParameters /////////////////////////////////////
declare module "helpers/cgi-helpers/core" {
    export interface ActionParam<T> {
        inputType: T;
    }

    export interface ActionConfig {
        /**
         * Replacement of `requiredParameters`.
         * `interface` of input type.
         * Default = null.
         */
        inputType?: string;
    }
}

declare module 'express/lib/request' {
    interface Request {
        inputType: any;
    }
}

const keyOfHelp: string = "help";

export function inputType(caller: string, type: string, outputType?: string): RequestHandler {
    return <any>(async (req: Request, res: Response, next: NextFunction) => {
        var helpKey: string = keyOfHelp;
        var help: string = req.parameters[helpKey];

        // if (help !== undefined) {
        //     let rtnary = [];
        //     try {
        //         let data = await ast.requestReportType({
        //             path: caller,
        //             type
        //         });
        //         return res.end(data);

        //     } catch(reason) {
        //         return next( reason );
        //     }
        // }

        try {
            var rtn = await ast.requestValidation({
                path: caller,
                type
            }, req.parameters);

            req.inputType = rtn;

        } catch(reason) {
            return next( reason );
        }
        
        next();
    });
}

////////////////////////////////////////////////////////////
