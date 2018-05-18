export const registerSubclass = (collectionName?) =>
    targetClass =>
        Parse.Object.registerSubclass(collectionName || targetClass.name, targetClass);

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
    }
}

export interface ParseTypedGetterSetter<T> {
    get<U extends keyof T>(key: U): T[U];
    set<U extends keyof T>(key: U, value: T[U], options?: Parse.Object.SetOptions): boolean;
}

export type StringLiteralDiff<T, U extends string> = ({[P in keyof T]: P } & {[P in U]: never } & { [x: string]: never })[keyof T];
export type Omit<T, K extends keyof T> = Pick<T, StringLiteralDiff<T, K>>;