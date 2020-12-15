export class Retrier {
    private callback: any;
    private timer: any;
    private interval: number;
    constructor(callback: any, interval: number) {
        this.callback = callback;
        this.interval = interval;
    }
    public start() {
        if (this.timer) return;
        this.timer = setInterval(this.callback, this.interval);
    }
    public stop() {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
    }
    public async do() {
        await this.callback();
    }
}
