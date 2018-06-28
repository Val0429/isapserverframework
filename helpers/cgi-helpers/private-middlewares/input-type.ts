import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { NextFunction, RequestHandler } from 'express/lib/router/index';
import { RoleList } from './../../../core/userRoles.gen';
import { Errors } from './../../../core/errors.gen';

import './../core';

/// requiredParameters /////////////////////////////////////
declare module "helpers/cgi-helpers/core" {
    export interface ActionConfig {
        /**
         * Replacement of `requiredParameters`.
         * `interface` of input type.
         * Default = null.
         */
        inputType?: string;
    }
}

export function inputType(caller: string, type: string): RequestHandler {
    return <any>((req: Request, res: Response, next: NextFunction) => {
        /// 1) Resolve & get input parameters, into structure

        /// 2) Convert structure
// console.log(caller, type);
// const sourceFile = reflector.getSourceFileOrThrow(caller);
// console.log(sourceFile);
// console.log(sourceFile.getInterface(type));


// interface IT {
//     time: number;
//     sourceFile: string;
//     importFile: string;
//     data: any;
// }

// console.time("123");
// const sourceFile = reflector.getSourceFileOrThrow(caller);
// console.timeEnd("123");
// //console.log(caller, sourceFile.getReferencingSourceFiles());
// //console.log(sourceFile.getImportDeclarations());
// console.log('len', sourceFile.getImportDeclarations().length);
// console.time('time');
// for (var sf of sourceFile.getImportDeclarations()) {
//     //console.log(sf.getNamedImports());
//     for (var sfni of sf.getNamedImports()) {
// console.time('time2');
//         if (sfni.getName() === type) {
//             var node = sfni.getNameNode();
//             //console.log(node.getDefinitions()[0].getDeclarationNode().getType().getProperties());
//             console.log(node.getDefinitions()[0]);

// if (TypeGuards.isInterfaceDeclaration(node)) {
//     console.log(node.getProperties());
// }
            
//             // console.log(node.getDefinitions()[0].getSourceFile().getInterface(type));
//             //var t = node.getDefinitions()[0].getSourceFile().getInterface(type);
// console.timeEnd('time2');
//             break;
//         }
// console.timeEnd('time2');
//     }
//     // console.log('got', sf.getSourceFile().get());
//     // console.log(sf.getSourceFile().getInterface(type));
// }
// console.timeEnd('time');


// console.log(caller, sourceFile);
// for (var sf of sourceFile.getTypeReferenceDirectives()) {
//     console.log(sf.getInterface(type));
// }


// console.log(neutralize(caller));
// //for (var p of sourceFile.getInterface("InputGet").getProperties()) {

        /// 3) Validate structure

        next();
    });
}

////////////////////////////////////////////////////////////


// import Project from "ts-simple-ast";

// const project = new Project({
//     tsConfigFilePath: "./tsconfig.json",
//     addFilesFromTsConfig: true,
// });

// import { Identifier } from 'ts-simple-ast';
// /// Interface
// const sourceFile = project.getSourceFileOrThrow("./workspace/cgi-bin/schedulers/index.ts");
// //for (var p of sourceFile.getInterface("InputGet").getProperties()) {
// var intf = sourceFile.getInterface("InputPost");
// for (var p of intf.getProperties()) {
//     var q = p.getQuestionTokenNode();
//     console.log(p.getName().toString(), q ? '?' : '', ': ', p.getType().getText(), ';');
// }
// for (var i in intf.getBaseDeclarations()) {
//     var o = intf.getBaseDeclarations()[i];
//     for (var p2 of (<any>o).getProperties()) {
//         var q2 = p2.getQuestionTokenNode();
//         console.log(p2.getName().toString(), q2 ? '?' : '', ': ', p2.getType().getText(), ';');
//     }
// }

