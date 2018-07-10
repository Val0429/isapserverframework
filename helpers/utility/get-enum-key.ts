export function getEnumKey(oEnum: any, value: any) {
    for (var key in oEnum) {
        if (value === oEnum[key]) return key;
    }
    return value;
}

export function EnumConverter(oEnum: any) {
    return (value: any) => {
        for (var key in oEnum) {
            if (value === oEnum[key]) return key;
        }
        return value;
    }
}