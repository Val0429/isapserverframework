import * as Parse from 'parse/node';

/// decorators //////////////
export const registerSubclass = (collectionName?) =>
    targetClass =>
        Parse.Object.registerSubclass(collectionName || targetClass.name, targetClass);

// var primaryKeyMap = new WeakMap();
var primaryKeyMap = {};
var primaryClassMap = {};
export const registerPrimaryKey = (primaryKey: string) => {
    return (target: new () => typeof target) => {
        var name = (new target).constructor.name;
        if (primaryKeyMap[name]) console.error(`<registerPrimaryKey> conflicts with key "${name}".`);
        primaryKeyMap[name] = primaryKey;
        primaryClassMap[name] = target;
    }
}
export const retrievePrimaryKey = (target: (new () => typeof target) | object): string => {
    var name = typeof target == 'object' ? target.constructor.name : (new target).constructor.name;
    return primaryKeyMap[name];
}
export function retrievePrimaryClass<T>(target: T): new () => T {
    var name = target.constructor.name;
    return primaryClassMap[name];
}
/////////////////////////////

export type SaveStatus = "update" | "insert";
export function AsParseObject(name) {
    return class ParseObject<T> extends Parse.Object {
        constructor(data?: Partial<T>) {
            super(name);
            data && super.set(data);
        }
        getValue<U extends keyof T>(key: U): T[U] {
            return super.get(key);
        }
        setValue<U extends keyof T>(key: U, value: T[U], options?: Parse.Object.SetOptions): boolean {
            return super.set(key, <any>value, options);
        }
        // async updateOrInsert(dontUpdate: boolean = false): Promise<this> {
        async updateOrInsert<T extends ParseObject<any>>(this: T, dontUpdate: boolean = false): Promise<{object: T, status: SaveStatus}> {
            var key = retrievePrimaryKey(this);
            var thisclass = retrievePrimaryClass(this);

            do {
                /// Check Object existance
                var obj = await new Parse.Query(thisclass)
                    .equalTo(key, this.get(key))
                    .first();
                
                /// update
                if (obj) {
                    do {
                        if (dontUpdate) break;
                        /// do update
                        for (var key in this.attributes)
                            obj.set(key, this.get(key));
                        await obj.save();
                    } while(0);

                    return Promise.resolve({object: <any>obj, status: "update" as SaveStatus});
                    // this.
                    // Object.assign(this, obj);
                    // return Promise.resolve("update" as SaveStatus);
                }

                /// insert
                await this.save();

            } while(0);
            return Promise.resolve({object: this, status: "insert" as SaveStatus});
        }

    // /// Check Person existance
    // var person: Person = await new Parse.Query(Person)
    //     .equalTo("username", data.parameters.username)
    //     .first() as Person;
    // if (person) return Errors.throw(Errors.VisitorAlreadyExists);
    
    // /// Create Person
    // person = new Person({
    //     username: data.parameters.username,
    // });
    // await person.save();
    //     }
    }
}

export interface ParseTypedGetterSetter<T> {
    get<U extends keyof T>(key: U): T[U];
    set<U extends keyof T>(key: U, value: T[U], options?: Parse.Object.SetOptions): boolean;
}

export type StringLiteralDiff<T, U extends string> = ({[P in keyof T]: P } & {[P in U]: never } & { [x: string]: never })[keyof T];
export type Omit<T, K extends keyof T> = Pick<T, StringLiteralDiff<T, K>>;
