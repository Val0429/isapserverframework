/// support:
/// contact.0
/// contact.0.address
export function getDeep(source: any, keys: string | string[]): any {
    if (source == null) return source;
    if (typeof keys === "string") keys = keys.split(".");
    let key = keys[0];
    if (!keys[0]) return;
    let value = source[key];
    if (keys.length === 1) return value;
    return getDeep(value, keys.slice(1, keys.length));
}

/// support:
/// contact.0
/// contact.* (asterisk should be the last field)
export function setDeep(source: any, keys: string | string[], value: any): any {
    // const regNumeric = /^[1-9][0-9]*$/;
    // if (source == null) source = {};
    // if (typeof keys === "string") keys = keys.split(".");
    // let data = source;
    // for (let i=0; i<keys.length; ++i)  {
    //     let thisKey = keys[i], nextKey = keys[i+1], last = (i === keys.length-1);
    //     if (last) data[thisKey] = value;
    //     else {
    //         data = data[thisKey] = data[thisKey] || {};
    //     }
    // }
    // return source;
    const regNumeric = /^[0-9]+$/;
    if (source == null) source = {};
    if (typeof keys === "string") keys = keys.split(".");
    let data = source;
    for (let i=0; i<keys.length; ++i)  {
        let thisKey = keys[i], nextKey = keys[i+1], last = (i === keys.length-1);
        if (last) {
            data[thisKey] = value;

        } else {
            // console.log("!!!", nextKey, regNumeric.test(nextKey));
            data = data[thisKey] = data[thisKey] || (
                (nextKey && (regNumeric.test(nextKey) || nextKey === "*")) ? [] : {}
            );
        }
    }
    return source;
}