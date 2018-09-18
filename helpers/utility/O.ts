let NF = new Proxy(() => ({}), { get(target, name) { return NF } });

export function O<T>(someObject: T, defaultValue: T = NF as any as T) : T {
    if (typeof someObject === 'undefined' || someObject === null)
        return defaultValue;
    else
        return someObject;
}