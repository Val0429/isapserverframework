/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { ParseObject } from "helpers/parse-server/parse-helper";
import { pickObject } from "helpers/utility/pick-object";
import { Mutex } from "helpers/utility";
import { Meta } from "helpers/utility/meta";
import { CacheParse } from "helpers/parse-server/cache-helper";

type ExtractInterface<T> = T extends Tree<infer U> ? U : never;
type Never<T> = { [P in keyof T]: never; }

interface ITreeCore {
    lft?: number;
    rgt?: number;
}
export type ITree<T extends Never<ITreeCore>> = ITreeCore & T;


export abstract class Tree<T> extends ParseObject<ITree<T>> {
    abstract groupBy: keyof T | null;

    constructor(data?: Partial<ITree<T>>) {
        super(data);

        /// get meta & check container
        let meta: any = Meta.get(this.constructor);
        if (meta.container === undefined || meta.container === null) {
            throw `<${this.constructor.name}> of Tree<T> must have meta <container>.`
        }
    }

    private static getMutex(thisClass: any): Mutex {
        return Meta.get(thisClass, "mutex", () => new Mutex());
    }

    /// get root leaf
    static async getRoot<T extends Tree<any>>(this: { new(): T }, groupBy?: any, CParse?: CacheParse): Promise<T> {
        let thisClass: { new(): T } = this;
        let groupByKey = new (this as any)().groupBy;
        if (groupByKey && !groupBy) throw `<${this.name}.getRoot> should provide <groupBy> parameter of <${groupByKey}>`;

        let query = (CParse ? CParse.Query(thisClass) : new Parse.Query<T>(thisClass));
        if (groupBy) query.equalTo(groupByKey, groupBy);
        query = query.equalTo("lft", 1);
        return query.first();
    }

    /// get all children
    async getChildren(CParse?: CacheParse): Promise<this[]> {
        let thisClass = this.constructor as any;
        let { lft, rgt } = this.attributes;
        let query = (CParse ? CParse.Query(thisClass) : new Parse.Query(thisClass))
            .greaterThanOrEqualTo("lft", lft)
            .lessThanOrEqualTo("rgt", rgt)
            .ascending("lft");
        if (this.groupBy) query.equalTo(this.groupBy as any, this.attributes[this.groupBy]);
        return query.find() as any;
    }

    /// get the first parent ancestor
    async getParentLeaf(CParse?: CacheParse): Promise<this> {
        let parents = await this.getParentLeafs(CParse);
        if (parents.length === 0) return null;
        return parents[0];
    }

    /// get parent leafs
    async getParentLeafs(CParse?: CacheParse): Promise<this[]> {
        let thisClass = this.constructor as any;
        let { lft, rgt } = this.attributes;
        let query = (CParse ? CParse.Query(thisClass) : new Parse.Query(thisClass))
            .lessThan("lft", lft)
            .greaterThan("rgt", rgt)
            .descending("lft");
        if (this.groupBy) query.equalTo(this.groupBy as any, this.attributes[this.groupBy]);
        return query.find() as any;
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
        let query = new Parse.Query(thisClass);
        if (this.groupBy) query.equalTo(this.groupBy as any, this.attributes[this.groupBy]);
        let results = await query.find();
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
    static async setRoot<T extends Tree<any>>(this: { new(): T }, data: ExtractInterface<T>, groupBy?: any): Promise<T> {
        let thisClass: { new(): T } = this;
        let mutex = Tree.getMutex(thisClass); await mutex.acquire();
        let root = await (this as any).getRoot(groupBy);
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
    async destroy<U extends Tree<T>>(this: U, options?: Parse.Object.DestroyOptions): Promise<this> {
        let thisClass: { new(): U } = this.constructor as any;
            
        let { rgt: refRgt, lft: refLft } = this.attributes;

        let mutex = Tree.getMutex(thisClass);
        await mutex.acquire();

        try {
            /// get all leafs
            let query = new Parse.Query(thisClass);
            if (this.groupBy) query.equalTo(this.groupBy as any, this.attributes[this.groupBy]);
            let results = await query.find();

            /// call destroy
            let deleteId = this.id;
            let result = await super.destroy(options);

            /// bulk write on the rest
            /// every other leafs lft or rgt > this.rgt, should decrease by 2
            let bulkWrites = [];
            let bulkDestroy = [];
            let padding = refRgt - refLft + 1;
            results.forEach((data) => {
                let { lft, rgt } = data.attributes;
                if (data.id === deleteId) return;
                if (lft > refLft && rgt < refRgt) {
                    bulkDestroy.push(data);
                    return;
                }
                if (lft > refRgt) data.setValue('lft', (lft - padding) as any);
                if (rgt > refRgt) data.setValue('rgt', (rgt - padding) as any);
                data.canSaveLftRgt = true;
                bulkWrites.push(data);
            });

            await Promise.all([Parse.Object.saveAll(bulkWrites), Parse.Object.destroyAll(bulkDestroy)]);

            return result;
        } catch (e) {
            throw e;
        } finally {
            mutex.release();
        }
    }    

    public canSaveLftRgt: boolean = false;
    /// override save, to prohibited lft & rgt
    async save(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Promise<this>;
    async save(key: string, value: any, options?: Parse.Object.SaveOptions): Promise<this>;
    async save(attrs: object, options?: Parse.Object.SaveOptions): Promise<this>;
    async save<U extends Tree<T>>(this: U, arg1?, arg2?, arg3?): Promise<this> {
        /// if inner called, by pass check
        if (this.canSaveLftRgt) return super.save(...arguments);

        /// if directly called, remove prohibited value
        let thisClass: { new (): U } = this.constructor as any;

        /// 1) remove prohibited
        let prohibited = ['lft', 'rgt'];
        let obj = !arg1 ? undefined : typeof arg1 === 'string' ? { [arg1]: arg2 } : arg1;
        let options = typeof arg1 === 'string' ? arg3 : arg2;

        /// 2) Fetch latest prohibited number
        let mutex = Tree.getMutex(thisClass);
        await mutex.acquire();

        try {
            let latest = await new Parse.Query(thisClass).get(this.id);
            obj = { ...obj, ...pickObject(latest.attributes, prohibited) };

            let result = await super.save(obj, options);

            return result;
        } catch (e) {
            throw e;
        } finally {
            mutex.release();
        }
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

export interface IGetTreeNodeL<T> {
    groupBy: T;
};
export interface IGetTreeNodeR {
    objectId: string;
}
export type IGetTreeNode<T> = IGetTreeNodeL<T> | IGetTreeNodeR;
function getTreeNode(nodeoptions: IGetTreeNode<any>) {

}