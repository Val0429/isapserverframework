export function getEnumKey(oEnum: any, value: any) {
    for (var key in oEnum) {
        if (value === oEnum[key]) return key;
    }
    return null;
}