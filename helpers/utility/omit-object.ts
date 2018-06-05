export function omitObject(value: object, keys: string[]) {
     return keys.reduce( (final, key) => (final[key] = value[key], final), {});
}