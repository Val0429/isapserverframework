
export namespace DynamicLoader {
    var classMap = {};

    export function set(name: string) {
        return (ctor) => {
            classMap[name] = ctor;
        }
    }

    export function get(name: string) {
        return classMap[name];
    }

    export function all() {
        return { ...classMap };
    }
}
