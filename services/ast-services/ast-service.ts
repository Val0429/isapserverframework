import { Request, TypesFromAction, RequestType, EnumRequestType, getRequestType, RequestNormal, ResponseNormal, ConverterEntity } from './ast-core';
import { Action } from './../../helpers/cgi-helpers/core';
import { Errors } from './../../core/errors.gen';
import Project, { Type, ts, Identifier, TypeGuards, InterfaceDeclaration, ClassDeclaration, SourceFile, PropertySignature } from 'ts-simple-ast';

var reflector: Project = this.reflector = new Project({
    tsConfigFilePath: "./tsconfig.json",    
});

class AstService {

    private analyzeType(type: TypesFromAction) {
        //console.log(this.getInterface(type));
        var inf = AstParser.getInterface(type) || AstParser.getTypeAlias(type);
        if (!inf) return;
        var mem = AstParser.getInterfaceMembers(inf);
        //console.log(mem);
        // mem.forEach( (data) => {
        //     console.log(`
        //         ${data.getName()}${data.getQuestionTokenNode() ? '?' : ''}:
        //         ${data.getType().getText()}
        //         `);
        //     let typ = data.getType();
        //     if (typ.isBoolean()) console.log('boolean type');
        //     if (typ.isArray()) console.log('array type');
        //     if (typ.isClass()) console.log('class type');
        //     if (typ.isClassOrInterface()) console.log('class or interface type');
        //     if (typ.isEnum()) console.log('enum type');
        //     if (typ.isInterface()) console.log('interface type');
        //     if (typ.isIntersection()) console.log('intersection type');
        //     if (typ.isLiteral()) console.log('literal type');
        //     if (typ.isNumber()) console.log('number type');
        //     if (typ.isObject()) console.log('object type');
        //     if (typ.isString()) console.log('string type');
        //     if (typ.isUnion()) console.log('union type');
        //     if (typ.isUnionOrIntersection()) console.log('union or intersection type');
        // });

        /**
         * Allow input types:
         * 1) boolean --- boolean
         * 2) Date --- string | number
         * 3) string --- string
         * 4) number --- number
         * 5) ParseObject --- string (objectId) | Object
         * 6) Array --- array
         * 7) Object --- Object
         * 8) Enum --- number | string
         * 9) Union
         * 10) Other Class?
         */

        //console.log(ifs.getMembers());
        // ifs.getMembers().forEach( (data) => console.log( (data as PropertySignature).getName() ) );

        // ifs.forEachChild

        // console.log( (ifs.getBaseDeclarations()[0] as InterfaceDeclaration).getMembers().forEach( (data) => console.log( (data as PropertySignature).getName() ) ) );
        //     console.timeEnd("123");
        // }

    }

    /**
     * get all inputTypes defined in Action[].
     */
    initActions(actions: Action[]): TypesFromAction[] {
        var rtn: TypesFromAction[] = [];
        const checklist = ["config", "funcAllConfig", "funcPostConfig", "funcGetConfig", "funcPutConfig", "funcDeleteConfig", "funcWsConfig"];
        for (var action of actions) {
            for (var check of checklist) {
                action[check] && action[check].inputType && ( rtn.push({ path: action.caller, type: action[check].inputType }) );
            }
        }
        rtn.forEach( (type) => this.analyzeType(type) );
        return rtn;
    }


    /**
     * validate normal request
     */
    validate(request: RequestNormal) {
        var inf = AstParser.getInterface(request.type);
        // var mem = this.getInterfaceMembers(inf);
        var data = request.data;

        AstParser.validateInterface(inf, data);

        return data;
    }

}

var ast = new AstService();

process.on('message', (data: Request) => {
    /// receive data
    switch (data.action) {
        case EnumRequestType.init:
            var rtinit = getRequestType(data.action, data);
            ast.initActions(rtinit.actions);
            break;

        case EnumRequestType.normal:
            var rtnormal = getRequestType(data.action, data);
            var rtn: any;
            try {
                rtn = ast.validate(rtnormal);
            } catch (reason) {
                if (!(reason instanceof Errors)) {
                    console.log(`ASTError: ${reason}`);
                    return;
                }
                rtn = reason;
            }
            process.send({
                action: rtnormal.action,
                sessionId: rtnormal.sessionId,
                data: rtn
            } as ResponseNormal);
            break;
        default:
            console.log(`Unknown ASTService type: ${data}`);
    }

    // console.log(`Message from parent: ${data}`);
});


namespace AstParser {
    export function getTypeAlias(type: TypesFromAction) {
        let sourceFile = type.path instanceof SourceFile ? type.path : reflector.getSourceFileOrThrow(type.path);
        /// 1) get type alias from source directly
        var tas = sourceFile.getTypeAlias(type.type);
        //tas.forEachChild( (data) => console.log(data.getText()) );
        //console.log(tas.getChildSyntaxList());
        //console.log(tas);
        // console.log(tas.getTypeNode().getText());
        //tas.getTypeNode().is
        // console.log(tas.getType().getTypeArguments());
        //console.log(tas.getTypeParameters());

        //tas.getTypeNode().forEachChild( (data) => console.log(data.getText()) );
    }

    export function getInterface(type: TypesFromAction): InterfaceDeclaration {
        let sourceFile = type.path instanceof SourceFile ? type.path : reflector.getSourceFileOrThrow(type.path);
        /// 1) get interface from source directly
        var inf = sourceFile.getInterface(type.type);
        if (inf) return inf;

        /// 2) get from named import
        /// 3) and also get from asterisk export
        inf = sourceFile.getImportDeclarations().reduce<InterfaceDeclaration>( (final, imd, i, ary) => {
            var result = imd.getNamedImports().reduce<InterfaceDeclaration>( (final, ims, i, ary2) => {
                if (ims.getName() === type.type) {
                    /// found
                    var sf = ims.getNameNode().getDefinitions()[0].getSourceFile();
                    ary.length = ary2.length = 0;
                    return AstParser.getInterface({path: sf, type: type.type});
                } return final;
            }, null);
            if (result) return result;
            return final;
        }, null);
        return inf;
    }

    export function getInterfaceMembers(inf: InterfaceDeclaration): PropertySignature[] {
        var result: PropertySignature[] = [];
        /// 1) push direct members
        inf.getMembers().forEach( (data) => {
            if (data instanceof PropertySignature) result.push(data);
        });

        /// 2) push base members
        inf.getBaseDeclarations().forEach( (data) => {
            if (data instanceof InterfaceDeclaration) {
                result = [...result, ...AstParser.getInterfaceMembers(data)];
            }
        });

        return result;
    }

    export function validateType(type: Type<ts.Type>, data: any, prefix: string = null) {
        
    }

    export function validateInterface(inf: InterfaceDeclaration, data: any, prefix: string = null) {
        function getName(name: string): string {
            return !prefix ? name : `${prefix}.${name}`;
        }
        function getImplementation(): string {
            return inf.getText();
        }

        try {

        var mem = AstParser.getInterfaceMembers(inf);

        /// 1) validate required
        mem.forEach( (prop) => {
            var name = prop.getName();
            var q = prop.getQuestionTokenNode();
            var obj = data[name];
            if (!q && (obj === undefined || obj === null)) throw Errors.throw(Errors.ParametersRequired, [`<${getName(name)}>`]);
        });


        /// 3) validate type
        /**
         * Allow input types:
         * 1) boolean --- boolean | string | number
         * 2) string --- string
         * 3) number --- string | number
         * 4) Date --- string | number
         * 5) Enum --- string | number
         * 6) ParseObject --- string (objectId) | Object
         * 7) Object --- Object
         * 8) Array --- Array
         * 9) Union
         * 10) Parse.File
         * 11) Tuple
         * X) Other Class X
         */
        mem.forEach( (prop) => {
            var name = prop.getName();
            var showname = getName(name);
            var type = prop.getType();
            var obj = data[name];
            if (obj === undefined) return;

            if (type.isBoolean()) {
                /// 1) boolean
                //console.log(`${name} is boolean, obj ${typeof obj}`);
                data[name] = AstConverter.toBoolean(obj, showname);

            } else if (type.isString()) {
                /// 2) string
                data[name] = AstConverter.toString(obj, showname);
                //console.log(`${name} is string, obj ${typeof obj}`);

            } else if (type.isNumber()) {
                /// 3) number
                data[name] = AstConverter.toNumber(obj, showname);
                // console.log(`${name} is number, obj ${typeof obj}`);

            } else if (type.getText() === 'Date') {
                /// 4) Date
                data[name] = AstConverter.toDateEntity(obj, showname);
                // console.log(`${name} is Date, obj ${typeof obj}`);

            } else if (type.isEnumLiteral()) {
                /// 5) Enum
                data[name] = AstConverter.toEnum(type, obj, showname);
                // console.log(`${name} is Enum, obj ${typeof obj}`);
            
            } else if (type.isClass()) {
                /// 6) ParseObject --- string (objectId) | Object
                data[name] = AstConverter.toParseObjectEntity(type, obj, showname);

            } else if (type.isInterface()) {
                /// 7) Object (Interface) --- Object
                data[name] = AstConverter.toObject(type, obj, showname);

            } else if (type.isArray()) {
                /// 8) Array --- Array
                data[name] = AstConverter.toArray(type, obj, showname);
            }

        });

        } catch (reason) {
            if (reason instanceof Errors) {
                if (reason.args.length > 0) {
                    reason.args[0] = reason.args[0] + `\n\n${getImplementation()}`;
                }
            }
            throw reason;
        }
                
    }
}


/// Value Converter
namespace AstConverter {

    export function toBoolean(input: string | number | boolean | any, name: string): boolean {
        return typeof input === 'string' ? (input === 'true' ? true : false) :
            typeof input === 'number' ? (input === 1 ? true : false) :
            (input ? true : false);
    }

    export function toString(input: string, name: string): string {
        if (typeof input !== 'string') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be string.`]);
        return input;
    }

    export function toNumber(input: string | number, name: string): number {
        if (typeof input !== 'string' && typeof input !== 'number') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be number.`]);
        if (typeof input === 'string') return parseInt(input, 10);
        return input;
    }

    export function toDateEntity(input: string | number, name: string): ConverterEntity {
        if (typeof input !== 'string' && typeof input !== 'number') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid string or number of Date.`]);
        return {
            __type__: "Date",
            data: new Date(input).toISOString()
        }
    }

    export function toEnum(type: Type<ts.Type>, input: string | number, name: string): string | number {
        var keyValue = {}, keyArray = [];
        /// get key / value pair
        type.getUnionTypes().forEach( (data) => {
            var name = data.getSymbol().getName();
            keyValue[ name ] = (<any>data.compilerType).value;
            keyArray.push(name);
        });

        /// match key first
        if (typeof input === 'string') {
            var result = keyValue[input];
            if (result !== undefined) return result;
        }

        /// match value
        for (var key in keyValue) {
            var value = keyValue[key];
            if (input === value) return value;
        }

        /// else throw
        throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be one of value <${keyArray.join(", ")}>.`])
    }

    export function toObject(type: Type<ts.Type>, input: object, name: string): object {
        if (typeof input !== 'object' || Array.isArray(input)) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid object.`]);
        var inf: InterfaceDeclaration = type.getSymbol().getDeclarations()[0] as InterfaceDeclaration;
        AstParser.validateInterface(inf, input, name);
        return input;
    }

    export function toArray(type: Type<ts.Type>, input: Array<any>, name: string): Array<any> {
        if (!Array.isArray(input)) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid array.`]);
        var tType = type.getTypeArguments()[0];
        for (var data of input) AstParser.validateType(tType, data, name);
        //console.log(tType.getText());
        //type.getSymbol().getDeclarations().forEach( (data) => console.log(data.getText()) );
        return input;
    }
    
    export function toParseObjectEntity(type: Type<ts.Type>, input: string | object, name: string): ConverterEntity {
        if (typeof input !== 'string' && typeof input !== 'object') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be objectId, or object itself.`]);
        var errorNotParseObject = () => {throw Errors.throw(Errors.CustomInvalid, [`<inputTypes> only support class of ParseObject for now. Type invalid on <${name}>`]);}
        var decl: ClassDeclaration = type.getSymbol().getValueDeclaration() as ClassDeclaration;
        var className = decl.getName();
        do {
            if (typeof input === 'string') break;
            var basedecl: ClassDeclaration = decl.getBaseClass();
            if (!basedecl) { errorNotParseObject(); break; }
            var po = basedecl.getName();
            if (po !== 'ParseObject') {errorNotParseObject(); break; }
            /// T
            var TType = decl.getBaseTypes()[0].getTypeArguments()[0];
            var Tdecl = TType.getSymbol().getValueDeclaration();
            var inf = TType.getSymbol().getDeclarations()[0] as InterfaceDeclaration;
            AstParser.validateInterface(inf, input, name);

        } while(0);

        return {
            __type__: "ParseObject",
            class: className,
            data: input
        }
    }
    
}
