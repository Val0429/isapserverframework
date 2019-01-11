export function jsMapAssign<T, U>(map: Map<T, U>, key: T, defaultValue: Function = () => new Map()): U {
    do {
        if (map.has(key)) break;
        map.set(key, defaultValue() as any);
    } while(0);
    return map.get(key);
}
