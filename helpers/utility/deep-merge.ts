function isObject(item) {
    return (item && typeof item === 'object' && !isArray(item));
}

function isArray(item) {
    return Array.isArray(item);
}

export function deepMerge(target, ...sources) {
    if (sources.length === 0) return target;
    const source = sources.shift();

    function mergeAlgorithm(target, source) {
        if (!isObject(target) || !isObject(source)) return source;
        if (target instanceof Date ||
            target instanceof Parse.File ||
            target instanceof Parse.Relation) return source;
        if (target instanceof Parse.Object) {
            if (!(source instanceof Parse.Object)) return source;
            target.attributes = mergeAlgorithm(target.attributes, source.attributes);
            return target;
        }
        /// finally, normal object
        for (let key in source) {
            let value = source[key];
            target[key] = mergeAlgorithm(target[key], source[key]);
        }
        return target;
    }

    target = mergeAlgorithm(target, source);

    return deepMerge(target, ...sources);
}

// export function deepMerge(target, ...sources) {
//   if (!sources.length) return target;
//   const source = sources.shift();

//   // if (isObject(target) && isObject(source)) {
//   //   for (const key in source) {
//   //     if (isObject(source[key])) {
//   //       /// if source is class instance, just replace
//   //       if (source[key].constructor && typeof(source[key].constructor) === 'function') {
//   //         Object.assign(target, { [key]: source[key] });
//   //         continue;
//   //       }
//   //       if (!target[key]) Object.assign(target, { [key]: {} });
//   //       deepMerge(target[key], source[key]);
//   //     } else {
//   //       Object.assign(target, { [key]: source[key] });
//   //     }
//   //   }
//   // }

                // else if (data instanceof Date) return data.toISOString();
                // else if (data instanceof Parse.File) return data.url();
                // else if (data instanceof Parse.Relation) return undefined;
                // else if (data instanceof Parse.Object) {

//   return deepMerge(target, ...sources);
// }