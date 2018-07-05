import { Request, TypesFromAction, RequestType, EnumRequestType, getRequestType, RequestNormal, ResponseNormal, AstConverter } from './ast-core';
import { Action } from './../../helpers/cgi-helpers/core';
import { Errors } from './../../core/errors.gen';
import Project, { Type, ts, Identifier, TypeGuards, InterfaceDeclaration, SourceFile, PropertySignature } from 'ts-simple-ast';

// let counter = 0;
// setInterval(() => {
//     process.send({ counter: counter++ });
// }, 1000);

class AstService {
    reflector: Project;

    constructor() {
        this.reflector = new Project({
            tsConfigFilePath: "./tsconfig.json",    
        });
    }

    private getTypeAlias(type: TypesFromAction) {
        let sourceFile = type.path instanceof SourceFile ? type.path : this.reflector.getSourceFileOrThrow(type.path);
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

    private getInterface(type: TypesFromAction): InterfaceDeclaration {
        let sourceFile = type.path instanceof SourceFile ? type.path : this.reflector.getSourceFileOrThrow(type.path);
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
                    return this.getInterface({path: sf, type: type.type});
                } return final;
            }, null);
            if (result) return result;
            return final;
        }, null);
        return inf;
    }

    private getInterfaceMembers(inf: InterfaceDeclaration): PropertySignature[] {
        var result: PropertySignature[] = [];
        /// 1) push direct members
        inf.getMembers().forEach( (data) => {
            if (data instanceof PropertySignature) result.push(data);
        });

        /// 2) push base members
        inf.getBaseDeclarations().forEach( (data) => {
            if (data instanceof InterfaceDeclaration) {
                result = [...result, ...this.getInterfaceMembers(data)];
            }
        });

        return result;
    }

    private analyzeType(type: TypesFromAction) {
        //console.log(this.getInterface(type));
        var inf = this.getInterface(type) || this.getTypeAlias(type);
        if (!inf) return;
        var mem = this.getInterfaceMembers(inf);
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
        var inf = this.getInterface(request.type);
        var mem = this.getInterfaceMembers(inf);
        var data = request.data;

        /// 1) collect valid params
        var valids = mem.map( (prop) => prop.getName() );

        /// 2) validate required
        mem.forEach( (prop) => {
            var name = prop.getName();
            var q = prop.getQuestionTokenNode();
            var obj = data[name];
            if (!q && (obj === undefined || obj === null)) throw Errors.throw(Errors.ParametersRequired, [name]);
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
         * 7) Array --- string | array
         * 8) Object --- string | Object
         * 9) Union
         * 10) Other Class?
         */
        mem.forEach( (prop) => {
            var name = prop.getName();
            var type = prop.getType();
            var obj = data[name];
            if (type.isBoolean()) {
                /// 1) boolean
                //console.log(`${name} is boolean, obj ${typeof obj}`);
                data[name] = AstConverter.toBoolean(obj, name);

            } else if (type.isString()) {
                /// 2) string
                data[name] = AstConverter.toString(obj, name);
                //console.log(`${name} is string, obj ${typeof obj}`);

            } else if (type.isNumber()) {
                /// 3) number
                data[name] = AstConverter.toNumber(obj, name);
                // console.log(`${name} is number, obj ${typeof obj}`);

            } else if (type.getText() === 'Date') {
                /// 4) Date
                data[name] = AstConverter.toDateEntity(obj, name);
                // console.log(`${name} is Date, obj ${typeof obj}`);

            } else if (type.isEnumLiteral()) {
                /// 5) Enum
                data[name] = this.toEnum(type, obj, name);
                // console.log(`${name} is Enum, obj ${typeof obj}`);
            }

        });
        

        return data;
    }


    private toEnum(type: Type<ts.Type>, input: string | number, name: string): string | number {
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
