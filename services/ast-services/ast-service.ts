/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import './../../core/alias';

import 'parse-server';
import { Request, TypesFromAction, RequestType, EnumRequestType, getRequestType, RequestNormal, ResponseNormal, RequestReportType, ResponseReportType, ConverterEntity } from './ast-core';
import { Action } from 'helpers/cgi-helpers/core';
import { Errors } from 'core/errors.gen';
import { deepMerge } from 'helpers/utility/deep-merge';
import { _O } from 'helpers/utility/O';
import { Project, Type, ts, InterfaceDeclaration, ImportSpecifier, ClassDeclaration, SourceFile, PropertySignature, EnumMember } from 'ts-morph';
import * as path from 'path';

const debug = false;

const tsConfigFilePath = path.resolve(`${__dirname}/../../tsconfig.json`);

var reflector: Project = this.reflector = new Project({
    tsConfigFilePath,
    addFilesFromTsConfig: true
});
// reflector.addSourceFilesAtPaths('node_modules/@types/**/*');
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

    /**
     * report type
     */
    reportType(request: RequestReportType) {
        let arytmp = [];
        /// Input Type
        let ir = [];

        let parseRestfulType = (types: (string | Type<ts.Type>)[]) => {
            /// Ignore Restful.*
            if (types.length === 0) return types;
            let firstType = types[0];
            if (typeof firstType !== 'string') return types;
            let regex = /Restful.[^<]+<([a-z0-9_]+)>/i;
            let matches = firstType.match(regex);
            if (!matches || (matches && matches.length < 2)) return types;
            return [firstType, AstParser.getType({ path: request.type.path, type: matches[1] })];
        }

        let types = AstParser.getReportType(request.type);
        types = parseRestfulType(types);
        if (!types) throw `Internal Error: type <${request.type.type}> is not a valid type.`;
        for (let type of types) {
            if (typeof type === 'string') {
                ir.push(type); continue;
            }
            ir = [...ir, ...AstParser.reportType(type, request)];
        }
        if (ir.length > 0) {
        arytmp.push(`
Input Interface:
==================================

${ir.join("\r\n")}
        `);
        }
        /// Output Type
        let otypes = AstParser.getOutputType(request.type);
        if (otypes) {
        otypes = parseRestfulType(otypes);
        let or = [];
        for (let type of otypes) {
            if (typeof type === 'string') {
                or.push(type); continue;
            }
            or = [...or, ...AstParser.reportType(type, request)];
        }
        if (or.length > 0) {
        arytmp.push(`
Output Interface:
==================================

${or.join("\r\n")}
        `);
        }}

        return arytmp.join("\r\n");
    }

}

var ast = new AstService();
/// workaround! hint for string & array can be empty or not.
let canBeEmpty = false;

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
                //canBeEmpty = false;
                canBeEmpty = true;
                rtn = ast.validate(rtnormal);
            } catch (reason) {
                if (!(reason instanceof Errors)) {
                    console.log(`ASTError: ${reason}`, reason);
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

        case EnumRequestType.normalSimple:
            var rtnormal = getRequestType(data.action, data);
            var rtn: any;
            try {
                canBeEmpty = true;
                rtn = ast.validate(rtnormal);
            } catch (reason) {
                if (!(reason instanceof Errors)) {
                    console.log(`ASTError: ${reason}`, reason);
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
            
        case EnumRequestType.requestType:
            var rtrequest = getRequestType(data.action, data);
            var rtn: any;
            try {
                rtn = ast.reportType(rtrequest);
            } catch(reason) {
                if (!(reason instanceof Errors)) {
                    console.log(`ASTError: ${reason}`);
                    return;
                }
                rtn = reason;
            }
            process.send({
                action: rtrequest.action,
                sessionId: rtrequest.sessionId,
                data: rtn
            } as ResponseReportType);
            break;
        
        default:
            console.log(`Unknown ASTService type: ${data}`);
    }

    // console.log(`Message from parent: ${data}`);
});

namespace AstParser {
    let fileNameToSourceMap = {};
    function getSourceFileFromImport(source: SourceFile, ims: ImportSpecifier): SourceFile {
        let name = ims.getName();
        let path = source.getFilePath();
        let key = `${path}/${name}`;
        let cache = fileNameToSourceMap[key];
        if (cache !== undefined) return cache;
        cache = ims.getNameNode().getDefinitions()[0].getSourceFile();
        fileNameToSourceMap[key] = cache;
        return cache;
    }

    export function getOutputType(type: TypesFromAction): (Type<ts.Type> | string)[] {
        let sourceFile = type.path instanceof SourceFile ? type.path : reflector.getSourceFileOrThrow(type.path);

        let document = sourceFile.getFullText();
        let regex = new RegExp(`\<\s*${type.type}\s*\,\s*([^\>\s]+)\s*\>`);
        let matches = document.match(regex);
        if (!matches || matches.length <= 1) return null;
        return getReportType({ path: type.path, type: matches[1].trim() });
    }

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
                    //var sf = ims.getNameNode().getDefinitions()[0].getSourceFile();
                    let sf = getSourceFileFromImport(sourceFile, ims);
                    ary.length = ary2.length = 0;
                    return AstParser.getType({path: sf, type: type.type});
                } return final;
            }, null);
            if (result) return result;
            return final;
        }, null);
        return rtn;
    }

    export function getReportType(type: TypesFromAction): (Type<ts.Type> | string)[] {
        let sourceFile = type.path instanceof SourceFile ? type.path : reflector.getSourceFileOrThrow(type.path);
        /// 1) get interface from source directly
        var inf = sourceFile.getInterface(type.type);
        if (inf) return [inf.getType()];
        var tas = sourceFile.getTypeAlias(type.type);
        if (tas) return [tas.getText(), tas.getType()];

        /// 2) get from named import
        /// 3) and also get from asterisk export
        var rtn: Type<ts.Type> = sourceFile.getImportDeclarations().reduce<Type<ts.Type>>( (final, imd, i, ary) => {
            var result = imd.getNamedImports().reduce<Type<ts.Type>>( (final, ims, i, ary2) => {
                if (ims.getName() === type.type) {
                    /// found
                    //var sf = ims.getNameNode().getDefinitions()[0].getSourceFile();
                    let sf = getSourceFileFromImport(sourceFile, ims);
                    ary.length = ary2.length = 0;
                    return AstParser.getType({path: sf, type: type.type});
                } return final;
            }, null);
            if (result) return result;
            return final;
        }, null);
        return rtn ? [rtn] : null;
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
        /// 2.1) make unique
        result = result.filter( (info, index) => {
            let name = info.getName();
            for (let i=0; i<index; ++i) if (result[i].getName() === name) return false;
            return true;
        });

        if (showinfo) {
            result.forEach( (info) => {
                console.log(`${info.getName()}${info.getQuestionTokenNode() ? '?' : ''}: ${info.getType().getText()};`);
            });
        }

        return result;
    }

    export function validateType(type: Type<ts.Type>, data: any, prefix: string = null, isArray: boolean = false, params: { [index: string]: Type<ts.Type> } = {}): any {
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
         * 16) Buffer
         * 17) Key Mapped Type
         * 18) object
         * 99) any
         * X) Other Class X
         */

        var showname = prefix;
        var obj = data;

        if (typeof obj === 'undefined') return undefined;
        if (obj === undefined || obj === null) return undefined;

        if (type.isBoolean()) {
            /// 1) boolean
            debug && console.log(`${showname} is boolean, obj ${typeof obj}`);
            return AstConverter.toBoolean(obj, showname, isArray);

        } else if (type.isString()) {
            /// 2) string
            debug && console.log(`${showname} is string, obj ${typeof obj}`);
            return AstConverter.toString(obj, showname, isArray);

        } else if (type.isNumber()) {
            /// 3) number
            debug && console.log(`${showname} is number, obj ${typeof obj}`);
            return AstConverter.toNumber(obj, showname, isArray);

        } else if (type.getText() === 'Date') {
            /// 4) Date
            debug && console.log(`${showname} is Date, obj ${typeof obj}`);
            return AstConverter.toDateEntity(obj, showname, isArray);

        } else if (type.getText() === 'Buffer') {
            /// 16) Buffer
            debug && console.log(`${showname} is Buffer, obj ${typeof obj}`);
            return AstConverter.toBufferEntity(obj, showname, isArray);

        } else if (type.isEnumLiteral()) {
            /// 5) Enum
            debug && console.log(`${showname} is Enum, obj ${typeof obj}`);
            return AstConverter.toEnum(type, obj, showname, isArray);
        
        } else if (type.isClass()) {
            if (type.getText() === 'Parse.File') {
                /// 10) Parse.File
                debug && console.log(`${showname} is ParseFile, obj ${typeof obj}`);
                return AstConverter.toParseFileEntity(type, obj, showname, isArray);
            } else {
                /// 6) ParseObject --- string (objectId) | Object
                debug && console.log(`${showname} is ParseObject, obj ${typeof obj}`);
                return AstConverter.toParseObjectEntity(type, obj, showname, isArray);
            }

        } else if (type.isInterface() || type.isAnonymous()) {
            /// 7) Object (Interface) --- Object
            /// 7.1) Anonymous Type
            debug && console.log(`${showname} is Interface or Anonymous, obj ${typeof obj}`);
            return AstConverter.toObject(type, obj, showname, isArray);

        } else if (type.isArray()) {
            /// 8) Array --- Array
            debug && console.log(`${showname} is Array, obj ${typeof obj}`);
            obj = [].concat(obj).filter((n) => n !== null && n !== undefined);
            return AstConverter.toArray(type, obj, showname);

        } else if (type.isTuple()) {
            /// 9) Tuple
            debug && console.log(`${showname} is Tuple, obj ${typeof obj}`);
            return AstConverter.toTuple(type, obj, showname);

        } else if (type.isNumberLiteral() || type.isBooleanLiteral() || type.isStringLiteral()) {
            /// 11) Literal Type
            debug && console.log(`${showname} is Literal, obj ${typeof obj}`);
            return AstConverter.ToLiteral(type, obj, showname);

        } else if (type.isIntersection()) {
            /// 12) Intersection
            debug && console.log(`${showname} is Intersection, obj ${typeof obj}`);
            return AstConverter.toIntersection(type, obj, showname, params);

        } else if (type.isUnion()) {
            /// 13) Union
            debug && console.log(`${showname} is Union, obj ${typeof obj}`);
            return AstConverter.toUnion(type, obj, showname, params);

        } else if (type.isObject() && type.getTypeArguments().length > 0) {
            /// 14) Generic
            debug && console.log(`${showname} is Generic, obj ${typeof obj}`);
            return AstConverter.toObject(type, obj, showname, isArray);

        } else if (type.isObject() && type.getSymbol().getName() === '__type') {
            /// 15) Partial
            var ttype = type.getTargetType();
            if (ttype && ttype.getAliasSymbol().getEscapedName() === 'Partial') {
                debug && console.log(`${showname} is Partial, obj ${typeof obj}`);
                var itype = type.getTypeArguments();
                if (itype.length === 0) itype = type.getAliasTypeArguments();
                return AstConverter.toObject(itype[0], obj, showname, false, true);
            }

        } else if (type.isTypeParameter() && !type.isString()) {
            /// 14) Generic too
            debug && console.log(`${showname} is Generic Type, obj ${typeof obj}`);
            var ntype = params[type.getText()];
            if (!ntype) throw Errors.throw(Errors.Custom, [`Internal Error: failed to handle type ${type.getText()}`]);
            return AstParser.validateType(ntype, obj, showname, isArray, params);

        } else if (type.getText() === "never") {
            return undefined;

        } else if (type.getText() === "any") {
            /// 99) Any
            return obj;

        } else if (type.getText() === "object") {
            if (typeof obj === "object") {
                debug && console.log(`${showname} is object, obj ${typeof obj}`);
                return obj;
            } else {
                throw Errors.throw(Errors.Custom, [`<${showname}> should be object.`]);
            }

        } else {
            if ( /\[[^\]]+\]$/.test(type.getText()) ) {
                /// * 17) Key Mapped Type
                debug && console.log(`${showname} is Key-Mapped Type, obj ${typeof obj}`);

                let typeChecker = reflector.getTypeChecker();
                let argType = (params[Object.keys(params)[0]] as any)._compilerType.value;
                let targetType = (<any>type).compilerType.objectType.members.get(argType).valueDeclaration;
                let cSourceFile = targetType.getSourceFile();
                let typeName = targetType.type.typeName.escapedText;
                let resolvedType = getType({ path: cSourceFile.fileName, type: typeName });

                return validateType(resolvedType, data, prefix, isArray, params);
            }

        }

        throw Errors.throw(Errors.Custom, [`Internal Error: cannot handle type ${type.getText()}.`]);
    }


    export function reportType(type: Type<ts.Type>, request?: RequestReportType): string[] {
        if (type.isInterface() || type.isAnonymous()) {
            return [AstParser.getTypeInfo(type)];

        } else if (type.isIntersection()) {
            /// 12) Intersection
            var types = type.getIntersectionTypes();
            let rtn = [AstParser.getTypeInfo(type)];
            for (let key=0; key<types.length; ++key)
                rtn = [...rtn, AstParser.getTypeInfo(types[key])];
            return rtn;
    
        } else if (type.isUnion()) {
            /// 13) Union
            var types = type.getUnionTypes();
            var rtn = [AstParser.getTypeInfo(type)];
            for (var key = 0; key < types.length; ++key)
                rtn = [...rtn, AstParser.getTypeInfo(types[key])];
            return rtn;

        } else if (type.isObject() && type.getTypeArguments().length > 0) {
            /// 14) Generic
            return [];

        } else if (type.getText() === "any") {
            /// 99) Any
            return [];
        }
        
        throw Errors.throw(Errors.Custom, [`Internal Error: cannot handle type ${type.getText()}.`]);
    }

    export function validateInterface(inf: InterfaceDeclaration, data: object, prefix: string = null, targs: Type<ts.Type>[] = [], forceOptional: boolean = false): object {
        function getName(name: string): string {
            return !prefix ? name : `${prefix}.${name}`;
        }
        function getImplementation(): string {
            return inf.getText();
        }

        //var params = inf.getTypeParameters ? inf.getTypeParameters().map( (data) => data.getText() ) : [];
        var params = !inf.getTypeParameters ? {} :
            inf.getTypeParameters().reduce((final, value, idx) => {
                final[value.getName()] = targs && targs[idx] ? targs[idx] : undefined;
                return final;
            }, {});

        try {

        if (data === null || data === undefined || typeof data !== 'object' || Array.isArray(data)) throw Errors.throw(Errors.CustomInvalid, [`<${prefix}> should be valid object.`]);

        var mem = AstParser.getInterfaceMembers(inf);

        var newdata = {};

        mem.forEach( (prop) => {
            var name = prop.getName();
            var showname = getName(name);
            var type = prop.getType();
            var obj = data[name];

            /// 0) handle generic
            if (targs) {
                var pos = params[type.getText()];
                if (pos) type = pos;
            }

            /// 1) validate required
            var q = prop.getQuestionTokenNode();
            /// filter never
            let never: boolean = prop.getType().getText() === 'never';
            if ((!q && !forceOptional && !never) &&
                (obj === undefined || obj === null)) throw Errors.throw(Errors.ParametersRequired, [`<${showname}>`]);
            newdata[name] = AstParser.validateType(type, obj, showname, false, params);
        });


        } catch (reason) {
            // if (reason instanceof Errors) {
            //     reason.append( Errors.throw(Errors.Custom, [`${getImplementation()}\r\n`]) );

            //     let base = inf;
            //     let declarations: (InterfaceDeclaration | TypeAliasDeclaration | ClassDeclaration)[];
            //     while ( base.getBaseDeclarations && (declarations = base.getBaseDeclarations()).length > 0 ) {
            //         base = declarations[0] as any as InterfaceDeclaration;
            //         reason.append( Errors.throw(Errors.Custom, [`${base.getText()}\r\n`]) );
            //     }
            //     reason.tag = newdata;
            // }
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
        if (!canBeEmpty && input.length === 0) throw Errors.throw(Errors.CustomInvalid, [`${name} should not be an empty string.`]);
        return input.trim();
    }

    export function toNumber(input: string | number, name: string, isArray: boolean = false): number {
        if (typeof input !== 'string' && typeof input !== 'number') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be number${isArray?'[]':''}.`]);
        if (typeof input === 'string') {
            let result = parseFloat(input);
            if (Number.isNaN(result)) throw Errors.throw(Errors.CustomInvalid, [`value of <${name}> is not convertable to number.`]); 
            return result;
        }
        return input;
    }

    export function toDateEntity(input: string | number, name: string, isArray: boolean = false): ConverterEntity {
        do {
            if (typeof input !== 'string' && typeof input !== 'number') break;
            try {
                if (typeof input === 'string' && /^[0-9]+$/.test(input)) input = +input;
                return {
                    __type__: "Date",
                    data: new Date(input).toISOString()
                }
            } catch(e) { break; }
            return;
        } while(0);
        throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid string or number of Date${isArray?'[]':''}.`]);
    }

    export function toBufferEntity(input: string, name: string, isArray: boolean = false): ConverterEntity {
        if (typeof input !== 'string') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid base64 string of Buffer${isArray?'[]':''}.`]);
        return {
            __type__: "Buffer",
            data: input
        }
    }

    export function toEnum(type: Type<ts.Type>, input: string | number, name: string, isArray: boolean = false): string | number {
        var keyValue = {}, keyArray = [];
        do {
            /// get key / value pair
            var types = type.getUnionTypes();
            /// enum literal
            if (types.length === 0) {
                var tname = type.getSymbol().getName();
                var tvalue = (type.getSymbol().getValueDeclaration() as EnumMember).getValue();
                if (tname == input || tvalue == input) return tvalue;
                throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be value <${tname}>.`])
            }

            types.forEach( (data) => {
                var name = data.getSymbol().getName();
                keyValue[ name ] = (<any>data.compilerType).value;
                keyArray.push(name);
            });

            /// disallow empty string
            if (input === '') break;

            /// match key first
            if (typeof input === 'string') {
                var result = keyValue[input];
                if (result !== undefined) return result;
            }

            /// match value
            for (var key in keyValue) {
                var value = keyValue[key];
                if (input == value) return value;
            }

        } while(0);

        /// else throw
        throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be one of value <${keyArray.join(", ")}>${isArray?'[]':''}.`])
    }

    export function toObject(type: Type<ts.Type>, input: object, name: string, isArray: boolean = false, forceOptional: boolean = false): object {
        //var inf: InterfaceDeclaration = type.getSymbol().getDeclarations()[0] as InterfaceDeclaration;
        let inf: InterfaceDeclaration = _O(_O(_O(type).getSymbol()).getDeclarations())[0] as InterfaceDeclaration;
        if (!inf) return {};    /// Anonymous object may not have interface
        var targs = type.getTypeArguments();
        if (targs.length === 0) targs = type.getAliasTypeArguments();
        input = AstParser.validateInterface(inf, input, name, targs, forceOptional);
        return input;
    }

    export function toArray(type: Type<ts.Type>, input: Array<any>, name: string): Array<any> {
        // Allow any type to be `Array`
        if (!Array.isArray(input)) input = [input];
        if (!canBeEmpty && input.length === 0) throw Errors.throw(Errors.CustomInvalid, [`${name} should not be an empty array.`]);
        var tType = type.getTypeArguments()[0];
        for (var key in input) input[key] = AstParser.validateType(tType, input[key], name, true);
        return input;

        // if (!Array.isArray(input)) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid array.`]);
        // if (!canBeEmpty && input.length === 0) throw Errors.throw(Errors.CustomInvalid, [`${name} should not be an empty array.`]);
        // var tType = type.getTypeArguments()[0];
        // for (var key in input) input[key] = AstParser.validateType(tType, input[key], name, true);
        // return input;
    }

    export function toTuple(type: Type<ts.Type>, input: Array<any>, name: string): Array<any> {
        // Allow any type to be `Array`
        if (!Array.isArray(input)) input = [input];
        // if (!Array.isArray(input)) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid array.`]);
        var types = type.getTypeArguments();
        
        /// test example: [string, ...string[]];
        let utypes = type.getText().match(/^\[(.*)\]$/)[1].split(",");
        if (/^\s*\.\.\./.test(utypes[utypes.length-1])) {
            /// array destructional assignment case
            let len = utypes.length - 1;
            if (input.length < len) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should contain at least ${len} elements.`]);
            for (let key = 0; key < input.length; ++key)
                input[key] = AstParser.validateType(types[Math.min(key, len)], input[key], `${name}.${key}`);
            return input;
        }

        /// normal case
        if (types.length !== input.length) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should with exact length of ${types.length}.`]);
        for (var key = 0; key < types.length; ++key)
            input[key] = AstParser.validateType(types[key], input[key], `${name}.${key}`);
        return input;
    }

    export function ToLiteral(type: Type<ts.Type>, input: boolean | string | number, name: string, isArray: boolean = false): boolean | string | number {
        var tc = (<any>type.compilerType);
        let value = type.isBooleanLiteral() ? type.getText() === 'true' : tc.value;
        if (value !== input) throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be ${typeof value} of ${value}.`]);
        return input;
    }

    export function toIntersection(type: Type<ts.Type>, input: object, name: string, params: { [index: string]: Type<ts.Type> }): object {
        // if (typeof input !== 'object') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid object${isArray?'[]':''}.`]);
        var types = type.getIntersectionTypes();
        var rtn = {};
        try {
            for (var key = 0; key < types.length; ++key)
                rtn = { ...rtn, ...AstParser.validateType(types[key], input, name, false, params) };
        } catch(reason) {
            if (reason instanceof Errors) {
                reason.append(Errors.throw(Errors.Custom, [`${AstParser.getTypeInfo(type)}\r\n`]));
                for (var type of types) reason.append(Errors.throw(Errors.Custom, [`${AstParser.getTypeInfo(type)}\r\n`]));
            }
            throw reason;
        }
        return rtn;
    }

    export function toUnion(type: Type<ts.Type>, input: any, name: string, params: { [index: string]: Type<ts.Type> }): any {
        var types = type.getUnionTypes();
        var passed = false;
        var reasons;
        var rtn = {};
        for (var key = 0; key < types.length; ++key) {
            try {
                var result = AstParser.validateType(types[key], input, name, false, params);
                passed = true;
                if (typeof result !== 'object') return result;
                deepMerge(rtn, result);
                
            } catch(reason) {
                if (!(reason instanceof Errors)) throw reason;
                if (!reasons) reasons = reason;
                else reasons.append(reason);
            }
        }
        if (passed) return rtn;
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
