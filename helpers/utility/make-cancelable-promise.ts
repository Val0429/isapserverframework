import { Observable } from "rxjs";

interface ICancelablePromise<T> {
    promise: Promise<T>;
    cancel: () => void;
}

export function makeCancelablePromise<T>(input: Observable<T>): ICancelablePromise<T> {
    let resolve, reject;
    let promise = new Promise<T>( (res, rej) => {
        resolve = res, reject = rej;
    });
    let subscription = input.subscribe( (data) => {
        subscription.unsubscribe();
        resolve(data);
    });
    let cancel = () => {
        subscription.unsubscribe();
        reject("canceled");
    }
    return { promise, cancel };
}
