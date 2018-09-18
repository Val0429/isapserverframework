export class Semaphore {
    private max: number;
    private count: number;
    private promises: any[] = [];
    private completed: any[] = [];

    constructor(max: number) {
        this.max = this.count = max;
    }
    public toPromise(): Promise<void> {
        if (this.count > 0) { --this.count; return Promise.resolve(); }
        let result;
        let promise = new Promise<void>((resolve) => result = resolve);
        this.promises.push(result);
        return promise;
    }
    public acquire(): Promise<void> {
        return this.toPromise();
    }
    public release() {
        var resolve = this.promises.shift();
        if (resolve === undefined) {
            this.count = Math.min(++this.count, this.max);
            if (this.count === this.max) while (this.completed.length > 0) (this.completed.shift())();
            return;
        }
        resolve();
    }
    public onCompleted(): Promise<void> {
        if (this.count === this.max) return Promise.resolve();
        let result;
        let promise = new Promise<void>((resolve) => result = resolve);
        this.completed.push(result);
        return promise;
    }
}