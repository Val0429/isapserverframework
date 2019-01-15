type WaitData = any;
type Resolver = any;
type ISocketResolverWaitObject = [WaitData, Resolver];

export class SocketResolver {
    private waitObjects: ISocketResolverWaitObject[] = [];

    wait(data = undefined): Promise<any> {
        return new Promise( (resolve) => {
            this.waitObjects.push([data, resolve]);
        });
    }

    resolve(data = undefined) {
        let idx = this.waitObjects.findIndex( (obj) => obj[0] === data );
        if (idx<0) return;
        let resolve = (this.waitObjects.splice(idx, 1)[0][1] as any);
        let obj = resolve();
    }
}