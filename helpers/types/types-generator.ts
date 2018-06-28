import { Action, ActionConfig } from './../cgi-helpers/core';
import Project, { Identifier, TypeGuards, InterfaceDeclaration, SourceFile, PropertySignature } from 'ts-simple-ast';
const reflector = new Project({
    tsConfigFilePath: "./tsconfig.json",    
});

const inputTypeName: string = "inputType";

interface InputType {
    path: string;
    typeName: string;
}

export function typesGenerator(actions: Action[]) {
    /// 1) check all "inputType"
    var inputTypes = getInputTypes(actions);
    /// 2) extract "inputType" info
    inputTypes.forEach( (type) => extractInputType(type) );
}

/**
 * Private Helpers
 */
function extractStructureFromInterface(input: InterfaceDeclaration[]) {
    function printProperty(property: PropertySignature) {
        var name = property.getName();
        var q = property.getQuestionTokenNode();
        //var type = property.getType().getText();
        var typeNode = property.getTypeNode();
        var type = typeNode.getType();
        var text = typeNode.getText();
        console.log(`${name}${q?'?':''}: ${text};`);
        console.log('array', type.isArray(), 'string', type.isString(), 'number', type.isNumber(), 'union', type.isUnion());
        if (type.isUnion()) {
            console.log(type.getUnionTypes().map( (data) => data.getText() ));
        }
    }

    for (var declaration of input) {
        for (var property of declaration.getProperties()) {
            printProperty(property);
        }
        /// find base
        var base = declaration.getBaseDeclarations();
        extractStructureFromInterface(base as InterfaceDeclaration[]);
    }
}

function getInterfaceFromType(sourceFile: SourceFile, type: string): InterfaceDeclaration[] {
    /// check file interface first
    var ifs = sourceFile.getInterfaces();
    var impl = ifs.reduce( (final, value) => {
        if (value.getName() === type) final.push(value);
        return final;
    }, []);
    if (impl.length > 0) return impl;

    /// if not, get from imports
    var imports = sourceFile.getImportDeclarations();
    for (var declaration of imports) {
        var namedImports = declaration.getNamedImports();
        for (var namedImport of namedImports) {
            var ai = namedImport.getAliasIdentifier();
            if (namedImport.getName() === type || (ai && ai.getText() === type) ) {
                var node = namedImport.getNameNode();
                return node.getDefinitionNodes() as InterfaceDeclaration[];
                // var definitionNode = node.getDefinitionNodes()[0];
                // console.log("length", node.getDefinitionNodes().length);
                // if (TypeGuards.isInterfaceDeclaration(definitionNode))
                //     return definitionNode;
            }
        }
    }
    return null;
}
    // var impl = sourceFile.getInterface(type.typeName);
    // /// if not, get from imports
    // var imports = sourceFile.getImportDeclarations();
    // for (var declaration of imports) {
    //     var namedImports = declaration.getNamedImports();
    // }
    // console.log(impl);

function extractInputType(type: InputType) {
    /// get source file
    const sourceFile = reflector.getSourceFileOrThrow(type.path);
    /// try get interface
    var rtntype = getInterfaceFromType(sourceFile, type.typeName);
    var tt = extractStructureFromInterface(rtntype);
    console.log(tt);
}

/// get InputTypes by Action[]
function getInputTypes(actions: Action[]): InputType[] {
    var result: InputType[] = [];

    function parseConfig(this: Action, config: ActionConfig) {
        if (!config) return;
        var name = null;
        if (name = config[inputTypeName]) {
            result.push({
                path: this.caller,
                typeName: name
            })
        }
    }

    var parseAction = (action: Action) => {
        var configs = [
            action.config,
            action.funcAllConfig,
            action.funcGetConfig,
            action.funcPostConfig,
            action.funcPutConfig,
            action.funcDeleteConfig,
            action.funcWsConfig
        ];

        configs.forEach( (config) => parseConfig.call(action, config) );
    }

    for (var action of actions) {
        parseAction(action);
    }

    return result;
}
/**
 * Private Helpers End
 */

// export function inputType(caller: string, type: string): RequestHandler {
//     return <any>((req: Request, res: Response, next: NextFunction) => {
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

//         next();
//     });
// }

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

