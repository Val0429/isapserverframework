let blockingKey: RegExp;
let blockingException: string;
export function routerBlock(key: RegExp, exception?: string) {
    blockingKey = key;
    blockingException = exception;
}

export { blockingKey, blockingException };