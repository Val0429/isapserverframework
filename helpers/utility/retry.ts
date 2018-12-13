import { Log } from "./log";

export async function retry<T>(
    func: (
        resolve: (value?: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void
    ) => void | Promise<void>,
    times: number = 10, hintname: string = null ): Promise<T> {

    let count: number = 0;
    let err;
    return new Promise<T>( async (resolve, reject) => {
        do {
            try {
                return resolve( await new Promise<T>( (resolve, reject) => func(resolve, reject)) );
            } catch(e) {
                err = e;
            }

            /// error log
            let test = Math.log10(count);
            if (test > 0 && Number.isInteger(test)) Log.Error("Critical Error", `${hintname ? `Function <${hintname}> ` : ''}Retry ${count} times with error: ${err}`);

        } while(times === 0 || (++count < times));
        return reject(err);
    });
}
