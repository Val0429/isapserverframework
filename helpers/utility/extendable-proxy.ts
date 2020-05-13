export class ExtendableProxy {
    constructor() {
        return new Proxy({}, {
            set: (key: string, value: any) => this.Setter(key, value),
            get: (key: string) => this.Getter(key)
        }) as any;
    }

    protected Getter(key: string) {
        throw "ExtendableProxy <Getter> should be implemented.";
    }
    protected Setter(key: string, value: any): boolean {
        throw "ExtendableProxy <Setter> should be implemented.";
    }
}