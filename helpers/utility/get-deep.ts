export function getDeep(source: any, keys: string | string[]): any {
    if (source == null) return source;
    if (typeof keys === "string") keys = keys.split(".");
    let key = keys[0];
    if (!keys[0]) return;
    let value = source[key];
    if (keys.length === 1) return value;
    return getDeep(value, keys.slice(1, keys.length));
}