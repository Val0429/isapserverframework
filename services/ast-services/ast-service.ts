import { Request, TypesFromAction, RequestType, EnumRequestType, getRequestType, RequestNormal, ResponseNormal, ConverterEntity } from './ast-core';
import { Action } from './../../helpers/cgi-helpers/core';
import { Errors } from './../../core/errors.gen';
import Project, { Type, ts, Identifier, TypeGuards, InterfaceDeclaration, ClassDeclaration, SourceFile, PropertySignature } from 'ts-simple-ast';

var reflector: Project = this.reflector = new Project({
    tsConfigFilePath: "./tsconfig.json",
    addFilesFromTsConfig: true
});
reflector.addExistingSourceFiles("node_modules/@types/**/*");
var tSource = reflector.getSourceFile(`ast-core.ts`);

class AstService {

    private analyzeType(type: TypesFromAction) {
        /// preload the types
        var inf = AstParser.getType(type);
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
        var data = request.data;
        var type = AstParser.getType(request.type);
        if (!type) throw `Internal Error: type <${request.type.type}> is not a valid type.`;
        data = AstParser.validateType(type, data);

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
    export function getType(type: TypesFromAction): Type<ts.Type> {
        let sourceFile = type.path instanceof SourceFile ? type.path : reflector.getSourceFileOrThrow(type.path);
        /// 1) get interface from source directly
        var inf = sourceFile.getInterface(type.type);
        if (inf) return inf.getType();
        var tas = sourceFile.getTypeAlias(type.type);
        if (tas) return tas.getType();

        /// 2) get from named import
        /// 3) and also get from asterisk export
        var rtn: Type<ts.Type> = sourceFile.getImportDeclarations().reduce<Type<ts.Type>>( (final, imd, i, ary) => {
            var result = imd.getNamedImports().reduce<Type<ts.Type>>( (final, ims, i, ary2) => {
                if (ims.getName() === type.type) {
                    /// found
                    var sf = ims.getNameNode().getDefinitions()[0].getSourceFile();
                    ary.length = ary2.length = 0;
                    return AstParser.getType({path: sf, type: type.type});
                } return final;
            }, null);
            if (result) return result;
            return final;
        }, null);
        return rtn;
    }

    export function getInterfaceMembers(inf: InterfaceDeclaration, showinfo: boolean = false): PropertySignature[] {
        var result: PropertySignature[] = [];
        /// 1) push direct members
        inf.getMembers().forEach( (data) => {
            if (data instanceof PropertySignature) result.push(data);
        });

        /// 2) push base members
        inf.getBaseDeclarations && inf.getBaseDeclarations().forEach( (data) => {
            if (data instanceof InterfaceDeclaration) {
                result = [...result, ...AstParser.getInterfaceMembers(data)];
            }
        });

        if (showinfo) {
            result.forEach( (info) => {
                console.log(`${info.getName()}${info.getQuestionTokenNode() ? '?' : ''}: ${info.getType().getText()};`);
            });
        }

        return result;
    }

    export function validateType(type: Type<ts.Type>, data: any, prefix: string = null, isArray: boolean = false): any {

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
         * 7.1) Anonymous Type
         * 8) Array --- Array
         * 9) Tuple
         * 10) Parse.File
         * 11) Literal Type
         * 12) Intersection
         * 13) Union
         * 14) Generic
         * 15) Any
         * X) Other Class X
         */

        var showname = prefix;
        var obj = data;

        if (type.isBoolean()) {
            /// 1) boolean
            //console.log(`${name} is boolean, obj ${typeof obj}`);
            return AstConverter.toBoolean(obj, showname, isArray);

        } else if (type.isString()) {
            /// 2) string
            return AstConverter.toString(obj, showname, isArray);
            //console.log(`${name} is string, obj ${typeof obj}`);

        } else if (type.isNumber()) {
            /// 3) number
            return AstConverter.toNumber(obj, showname, isArray);
            // console.log(`${name} is number, obj ${typeof obj}`);

        } else if (type.getText() === 'Date') {
            /// 4) Date
            return AstConverter.toDateEntity(obj, showname, isArray);
            // console.log(`${name} is Date, obj ${typeof obj}`);

        } else if (type.isEnumLiteral()) {
            /// 5) Enum
            return AstConverter.toEnum(type, obj, showname, isArray);
            // console.log(`${name} is Enum, obj ${typeof obj}`);
        
        } else if (type.isClass()) {
            if (type.getText() === 'Parse.File') {
                /// 10) Parse.File
                return AstConverter.toParseFileEntity(type, obj, showname, isArray);
            } else {
                /// 6) ParseObject --- string (objectId) | Object
                return AstConverter.toParseObjectEntity(type, obj, showname, isArray);
            }

        } else if (type.isInterface() || type.isAnonymous()) {
            /// 7) Object (Interface) --- Object
            /// 7.1) Anonymous Type
            return AstConverter.toObject(type, obj, showname, isArray);

        } else if (type.isArray()) {
            /// 8) Array --- Array
            return AstConverter.toArray(type, obj, showname);

        } else if (type.isTuple()) {
            /// 9) Tuple
            return AstConverter.toTuple(type, obj, showname);

        } else if (type.isNumberLiteral() || type.isBooleanLiteral() || type.isStringLiteral()) {
            /// 11) Literal Type
            return AstConverter.ToLiteral(type, obj, showname);

        } else if (type.isIntersection()) {
            /// 12) Intersection
            return AstConverter.toIntersection(type, obj, showname);
        } else if (type.isUnion()) {
            /// 13) Union
            return AstConverter.toUnion(type, obj, showname);

        } else if (type.isObject() && type.getTypeArguments().length > 0) {
            /// 14) Generic
            // console.log(
            //     type.isAnonymous(),
            //     type.isArray(),
            //     type.isClass(),
            //     type.isClassOrInterface(),
            //     type.isIntersection(),
            //     type.isObject(),
            //     type.isTypeParameter(),
            // );
            // console.log(type.getTypeArguments()[0].isString());
            //console.log(type.getTargetType().getText());
            // var ifs = AstParser.getInterfaceMembers( type.getTargetType().getSymbol().getDeclarations()[0] as InterfaceDeclaration, true) ;
            // console.log(ifs[0]);
            // console.log( (<any>type.getTargetType().getSymbol().getDeclarations[0]) );
            // console.log(ifs[0].getType().compilerType);
            //return AstConverter.
            // var ifs = AstParser.getInterfaceMembers(type.getSymbol().getDeclarations()[0] as InterfaceDeclaration, true);
            // console.log(ifs[0].getType().getApparentType().getText());
            //console.log('???', showname, AstParser.getInterfaceMembers(type.getSymbol().getDeclarations()[0] as InterfaceDeclaration));

            /// 1) get type resolve to
            //console.log(type.getText(), type.getSymbol().getName());
            //console.log(type.getTypeArguments()[0], type.getTypeArguments()[0].getText());

            return AstConverter.toObject(type, obj, showname, isArray);
        }

        throw Errors.throw(Errors.Custom, [`Internal Error: cannot handle type ${type.getText()}.`]);
        /// todo: error handle
        //return obj;

    }

    export function validateInterface(inf: InterfaceDeclaration, data: object, prefix: string = null, targs: Type<ts.Type>[] = []): object {
        function getName(name: string): string {
            return !prefix ? name : `${prefix}.${name}`;
        }
        function getImplementation(): string {
            return inf.getText();
        }

        var params = inf.getTypeParameters ? inf.getTypeParameters().map( (data) => data.getText() ) : [];

        try {

        if (typeof data !== 'object' || Array.isArray(data)) throw Errors.throw(Errors.CustomInvalid, [`<${prefix}> should be valid object.`]);

        var mem = AstParser.getInterfaceMembers(inf);

        var newdata = {};

        mem.forEach( (prop) => {
            var name = prop.getName();
            var showname = getName(name);
            var type = prop.getType();
            var obj = data[name];

            /// 0) handle generic
            if (targs) {
                var pos = params.indexOf( type.getText() );
                if (pos >= 0) type = targs[pos];
            }

            /// 1) validate required
            var q = prop.getQuestionTokenNode();
            if (!q && (obj === undefined || obj === null)) throw Errors.throw(Errors.ParametersRequired, [`<${showname}>`]);

            newdata[name] = AstParser.validateType(type, obj, showname);
        });


        } catch (reason) {
            if (reason instanceof Errors) {
                reason.append( Errors.throw(Errors.Custom, [`${getImplementation()}\r\n`]) );
                reason.tag = newdata;
            }
            throw reason;
        }

        return newdata;       
    }

    export function getTypeInfo(type: Type<ts.Type>): string {
        var symbol = type.getSymbol() || type.getAliasSymbol();
        if (!symbol) return null;
        return symbol.getDeclarations()[0].getText();
    }
}


/// Value Converter
namespace AstConverter {

    export function toBoolean(input: string | number | boolean | any, name: string, isArray: boolean = false): boolean {
        return typeof input === 'string' ? (input === 'true' ? true : false) :
            typeof input === 'number' ? (input === 1 ? true : false) :
            (input ? true : false);
    }

    export function toString(input: string, name: string, isArray: boolean = false): string {
        if (typeof input !== 'string') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be string${isArray?'[]':''}.`]);
        return input;
    }

    export function toNumber(input: string | number, name: string, isArray: boolean = false): number {
        if (typeof input !== 'string' && typeof input !== 'number') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be number${isArray?'[]':''}.`]);
        if (typeof input === 'string') return parseInt(input, 10);
        return input;
    }

    export function toDateEntity(input: string | number, name: string, isArray: boolean = false): ConverterEntity {
        if (typeof input !== 'string' && typeof input !== 'number') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid string or number of Date${isArray?'[]':''}.`]);
        return {
            __type__: "Date",
            data: new Date(input).toISOString()
        }
    }

    export function toEnum(type: Type<ts.Type>, input: string | number, name: string, isArray: boolean = false): string | number {
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
        throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be one of value <${keyArray.join(", ")}>${isArray?'[]':''}.`])
    }

    export function toObject(type: Type<ts.Type>, input: object, name: string, isArray: boolean = false): object {
        var inf: InterfaceDeclaration = type.getSymbol().getDeclarations()[0] as InterfaceDeclaration;
        var targs = type.getTypeArguments();
        input = AstParser.validateInterface(inf, input, name, targs);
        return input;
    }

    export function toArray(type: Type<ts.Type>, input: Array<any>, name: string): Array<any> {
        if (!Array.isArray(input)) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid array.`]);
        var tType = type.getTypeArguments()[0];
        for (var key in input) input[key] = AstParser.validateType(tType, input[key], name, true);
        return input;
    }

    export function toTuple(type: Type<ts.Type>, input: Array<any>, name: string): Array<any> {
        if (!Array.isArray(input)) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid array.`]);
        var types = type.getTypeArguments();
        if (types.length !== input.length) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should with exact length of ${types.length}.`]);
        for (var key = 0; key < types.length; ++key)
            input[key] = AstParser.validateType(types[key], input[key], `${name}.${key}`);
        return input;
    }

    export function ToLiteral(type: Type<ts.Type>, input: boolean | string | number, name: string, isArray: boolean = false): boolean | string | number {
        var tc = (<any>type.compilerType);
        var value = type.isBooleanLiteral() ? type.getText() === 'true' :
            tc.freshType.value;
        if (value !== input) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be ${typeof value} of ${value}.`]);
        return input;
    }

    export function toIntersection(type: Type<ts.Type>, input: object, name: string): object {
        // if (typeof input !== 'object') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid object${isArray?'[]':''}.`]);
        var types = type.getIntersectionTypes();
        var rtn = {};
        try {
            for (var key = 0; key < types.length; ++key)
                rtn = { ...rtn, ...AstParser.validateType(types[key], input, name) };
        } catch(reason) {
            if (reason instanceof Errors) {
                reason.append(Errors.throw(Errors.Custom, [`${AstParser.getTypeInfo(type)}\r\n`]));
                for (var type of types) reason.append(Errors.throw(Errors.Custom, [`${AstParser.getTypeInfo(type)}\r\n`]));
            }
            throw reason;
        }
        return rtn;
    }

    export function toUnion(type: Type<ts.Type>, input: any, name: string): any {
        var types = type.getUnionTypes();
        var reasons;
        for (var key = 0; key < types.length; ++key) {
            try {
                return AstParser.validateType(types[key], input, name);
            } catch(reason) {
                if (!(reason instanceof Errors)) throw reason;
                if (!reasons) reasons = reason;
                else reasons.append(reason);
            }
        }
        reasons.append( Errors.throw(Errors.Custom, [`${AstParser.getTypeInfo(type)}\r\n`]) );
        throw reasons;
    }

    export function toParseFileEntity(type: Type<ts.Type>, input: string | object, name, isArray: boolean = false) {
        var type = AstParser.getType({path: tSource, type: 'vParseFile'});
        return {
            __type__: "Parse.File",
            data: AstParser.validateType(type, input, name, isArray)
        }
    }
    
    export function toParseObjectEntity(type: Type<ts.Type>, input: string | object, name: string, isArray: boolean = false): ConverterEntity {
        if (typeof input !== 'string' && typeof input !== 'object') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be${isArray?' Array of':''} objectId, or object itself.`]);
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
            input = AstParser.validateInterface(inf, input, name);

        } while(0);

        return {
            __type__: "ParseObject",
            class: className,
            data: input
        }
    }
    
}
