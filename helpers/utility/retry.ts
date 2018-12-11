export async function retry<T>(
    func: (
        resolve: (value?: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void
    ) => void | Promise<void>,
    times: number = 10 ): Promise<T> {

    let count: number = 0;
    let err;
    return new Promise<T>( async (resolve, reject) => {
        do {
            try {
                return resolve( await new Promise<T>( (resolve, reject) => func(resolve, reject)) );
            } catch(e) {
                err = e;
            }
        } while(times === 0 || (++count < times));
        return reject(err);
    });
}
