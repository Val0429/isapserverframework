/// pick object data, with given keys. reverse to ignore keys. also handle dot annotations.
export function pickObject(data: object, keys: string[], reverse?: boolean) {
    if (data === undefined || data === null) return data;
    /// make map
    let map = {};
    for (let key of keys) {
        let seperates = key.split(".");
        let length = seperates.length;
        if (length === 1) {
            map[seperates[0]] = true;
        } else {
            let cache = map;
            for (let i=1; i<=length; ++i) {
                if (i === length) cache[seperates[i-1]] = true;
                else cache = cache[seperates[i-1]] = {};
            }
        }
    }

    let pickObjectWithMap = (data: any, map: any, reverse?: boolean) => {
        if (data === undefined || data === null) return data;

        if (!reverse) {
            return Object.keys(map).reduce( (final, key) => {
                let val = map[key];
                if (val === true) final[key] = data[key];
                else final[key] = pickObjectWithMap(data[key], val, reverse);
                return final;
            }, {});
        } else {
            return Object.keys(data).reduce( (final, key) => {
                let val = map[key];
                if (val === true) return final;
                else if (!val) final[key] = data[key];
                else final[key] = pickObjectWithMap(data[key], val, reverse);
                return final;
            }, {});
        }
    }
    return pickObjectWithMap(data, map, reverse);
}    
