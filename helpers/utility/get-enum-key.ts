export function getEnumKey(oEnum: any, value: any) {
    for (var key in oEnum) {
        if (value === oEnum[key]) return key;
    }
    return value;
}

export function getEnumKeyArray(oEnum: any, value: any[]) {
    return value.map( val => getEnumKey(oEnum, val) );
}

export function EnumConverter(oEnum: any) {
    return (value: any) => getEnumKey(oEnum, value);
}