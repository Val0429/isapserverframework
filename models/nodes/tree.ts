import { ParseObject } from "helpers/parse-server/parse-helper";
import { pickObject } from "helpers/utility/pick-object";
import { Mutex } from "helpers/utility";
import { Meta } from "helpers/utility/meta";

type ExtractInterface<T> = T extends Tree<infer U> ? U : never;
type Never<T> = { [P in keyof T]: never; }

interface ITreeCore {
    lft?: number;
    rgt?: number;
}
export type ITree<T extends Never<ITreeCore>> = ITreeCore & T;

export class Tree<T> extends ParseObject<ITree<T>> {
    private static getMutex(thisClass: any): Mutex {
        return Meta.get(thisClass, "mutex", () => new Mutex());
    }

    /// get root leaf
    static async getRoot<T extends Tree<any>>(this: { new(): T }): Promise<T> {
        let thisClass: { new(): T } = this;
        return new Parse.Query<T>(thisClass)
            .equalTo("lft", 1)
            .first();
    }

    /// get the first parent ancestor
    async getParentLeaf<U extends Tree<T>>(this: U): Promise<U> {
        let parents = await this.getParentLeafs();
        if (parents.length === 0) return null;
        return parents[0];
    }

    /// get parent leafs
    async getParentLeafs<U extends Tree<T>>(this: U): Promise<U[]> {
        let thisClass: { new(): U } = this.constructor as any;
        let { lft, rgt } = this.attributes;
        return await new Parse.Query<U>(thisClass)
            .lessThan("lft", lft)
            .greaterThan("rgt", rgt)
            .descending("lft")
            .find();
    }

    /// add a child
    async addLeaf<U extends Tree<T>>(this: U, data: T): Promise<this> {
        /// add last leaf, lft = this.rgt, rgt = this.rgt+1
        /// every other leafs lft or rgt >= this.rgt, should increase by 2
        let thisClass: { new(): U } = this.constructor as any;
        let mutex = Tree.getMutex(thisClass); await mutex.acquire();
        /// before add, update me
        await this.updateLeafProhibited();
        /// 1) get all leafs
        let results = await new Parse.Query(thisClass)
            .find();
        let bulkWrites = [];
        /// 2) make new leaf and increase lft, rgt
        let refRgt = this.attributes.rgt;
        let rtn = new (thisClass as any)({
            ...(data as any as object), lft: refRgt, rgt: refRgt+1
        });
        rtn.canSaveLftRgt = true;
        bulkWrites.push( rtn );
        /// 3) calculate every other leafs
        results.forEach( (data) => {
            let { lft, rgt } = data.attributes;
            if (lft < refRgt && rgt < refRgt) return;
            if (lft >= refRgt) data.setValue("lft", lft+2 as any);
            if (rgt >= refRgt) data.setValue("rgt", rgt+2 as any);
            data.canSaveLftRgt = true;
            bulkWrites.push(data);
        });
        /// 4) bulk save
        try {
            await Parse.Object.saveAll(bulkWrites);
        } catch(e) { return Promise.reject(e) }
        finally { rtn.canSaveLftRgt = false; mutex.release(); }
        return rtn;
    }

    /// unfrequent helpers
    /// normally won't be used. make first root component.
    static async setRoot<T extends Tree<any>>(this: { new(): T }, data: ExtractInterface<T>): Promise<T> {
        let thisClass: { new(): T } = this;
        let mutex = Tree.getMutex(thisClass); await mutex.acquire();
        let root = await (this as any).getRoot();
        if (root) throw "Root already exists";
        let obj = new (thisClass as any)({
            ...data as object, lft: 1, rgt: 2
        });
        obj.canSaveLftRgt = true;
        let result: T;
        try {
            result = await obj.save();
        } catch(e) { return Promise.reject(e) }
        finally { obj.canSaveLftRgt = false; mutex.release(); }
        return result;
    }

    /// overwritten //////////////////////////////////////////////
    /// override destroy for correction lft & rgt
    destroy<U extends Tree<T>>(this: U, options?: Parse.Object.DestroyOptions): Parse.Promise<this> {
        let promise = new Parse.Promise<this>();
        let thisClass: { new(): U } = this.constructor as any;
        let { rgt: refRgt } = this.attributes;

        (async () => {
            let mutex = Tree.getMutex(thisClass); await mutex.acquire();
            try {
                /// get all leafs
                let results = await new Parse.Query(thisClass).find();
                /// call destroy
                let deleteId = this.id;
                await super.destroy(options);
                /// bulk write on the rest
                /// every other leafs lft or rgt > this.rgt, should decrease by 2
                let bulkWrites = [];
                results.forEach( (data) => {
                    let { lft, rgt } = data.attributes;
                    if (data.id === deleteId) return;
                    if (lft < refRgt && rgt < refRgt) return;
                    if (lft > refRgt) data.setValue("lft", lft-2 as any);
                    if (rgt > refRgt) data.setValue("rgt", rgt-2 as any);
                    data.canSaveLftRgt = true;
                    bulkWrites.push(data);
                });
                await Parse.Object.saveAll(bulkWrites);
                promise.resolve(this);
            } catch(e) { promise.reject(e); mutex.release(); }
        })();

        return promise;
    }    

    public canSaveLftRgt: boolean = false;
    /// override save, to prohibited lft & rgt
    save(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save(key: string, value: any, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save(attrs: object, options?: Parse.Object.SaveOptions): Parse.Promise<this>;
    save<U extends Tree<T>>(this: U, arg1?, arg2?, arg3?): Parse.Promise<this> {
        /// if inner called, by pass check
        if (this.canSaveLftRgt) return super.save(...arguments);

        /// if directly called, remove prohibited value
        let promise = new Parse.Promise<this>();
        let thisClass: { new(): U } = this.constructor as any;
        /// 1) remove prohibited
        let prohibited = ["lft", "rgt"];
        let obj = !arg1 ? undefined :
            typeof arg1 === 'string' ? { [arg1]: arg2 } :
            arg1;
        let options = typeof arg1 === 'string' ? arg3 : arg2;
        /// 2) Fetch latest prohibited number
        (async () => {
            let mutex = Tree.getMutex(thisClass); await mutex.acquire();
            try {
                let latest = await new Parse.Query(thisClass).get(this.id);
                obj = { ...obj, ...pickObject(latest.attributes, prohibited) };
                await super.save(obj, options);
            } catch(e) { promise.reject(e); mutex.release(); }
        })();
        return promise;
    }

    private async updateLeafProhibited<U extends Tree<T>>(this: U) {
        let thisClass: { new(): U } = this.constructor as any;
        let latest = await new Parse.Query(thisClass).get(this.id);
        let { lft, rgt } = latest.attributes;
        this.setValue("lft", lft as any);
        this.setValue("rgt", rgt as any);
    }
    //////////////////////////////////////////////////////////////
}