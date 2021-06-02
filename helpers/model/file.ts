import { sharedMongoDB } from 'helpers/parse-server/parse-helper';
import { ObjectId, Binary, Collection } from 'mongodb';
import { MongoData } from './mongo-data';

/**
 * File
 */
export type IFile = MongoData<{ binary: Binary; contentType?: string }>;

/**
 * File
 */
export class File {
    /**
     *
     */
    private _id: ObjectId = undefined;

    /**
     *
     */
    private _file: IFile = undefined;
    public get file(): IFile {
        return this._file;
    }

    /**
     *
     */
    private _collectionName: string = undefined;
    public get collectionName(): string {
        return this._collectionName;
    }

    /**
     * Constructor
     * @param collectionName
     */
    public constructor();
    public constructor(src: string);
    public constructor(collectionName: string);
    public constructor(value?: string) {
        value = value || 'file';

        try {
            let info = this.GetInfo(value);
            this._collectionName = info.collectionName;
            this._id = new ObjectId(info.objectId);
        } catch (e) {
            let routings: string[] = value.split('-');
            value = routings.map((n) => `${n.substring(0, 1).toUpperCase()}${n.substring(1)}`).join('');

            this._collectionName = value;
        }
    }

    /**
     * Get Info
     * @param src
     */
    public GetInfo(src: string): { objectId: string; collectionName: string } {
        try {
            if (!src) {
                throw 'src can not null or empty';
            }

            let regex: RegExp = new RegExp(/file\/.*\/.*/);
            if (!regex.test(src)) {
                throw 'src format error';
            }

            let routing: string[] = src.split(/\//);

            let objectId = routing[2];
            if (!objectId) {
                throw 'src format error';
            }

            let collectionName: string = routing[1];
            if (!collectionName) {
                throw 'src format error';
            }

            let routings: string[] = collectionName.split('-');
            collectionName = routings.map((n) => `${n.substring(0, 1).toUpperCase()}${n.substring(1)}`).join('');

            return {
                objectId: objectId,
                collectionName: collectionName,
            };
        } catch (e) {
            throw e;
        }
    }

    /**
     * Set Id
     * @param objectId
     */
    public SetId(objectId: string): File {
        try {
            this._id = new ObjectId(objectId);

            return this;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Set Id By Src
     * @param file
     */
    public SetIdBySrc(src: string): File {
        try {
            let info = this.GetInfo(src);

            this._id = new ObjectId(info.objectId);

            return this;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Query
     * @param file
     */
    public async Query(this: File): Promise<File> {
        try {
            if (!this._id) {
                throw 'not set id yet';
            }

            let db = await sharedMongoDB();

            let collection: Collection<IFile> = db.collection(this._collectionName);

            let file = await collection.findOne({ _id: this._id });
            if (!file) {
                throw 'file not found';
            }

            this._file = file;

            return this;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save
     * @param buffer
     * @param contentType
     */
    public async Save(this: File, buffer: Buffer, contentType: string): Promise<File> {
        try {
            let db = await sharedMongoDB();

            let collection: Collection<IFile> = db.collection(this._collectionName);

            let now: Date = new Date();

            let file: IFile = await collection.findOne({ _id: this._id });
            if (!file) {
                file = {
                    binary: new Binary(buffer),
                    contentType: contentType,
                    _created_at: now,
                    _updated_at: now,
                };
            } else {
                file = {
                    binary: new Binary(buffer),
                    contentType: contentType,
                    _created_at: file._created_at,
                    _updated_at: now,
                };
            }

            if (!this._id) {
                let result = await collection.insertOne(file);
                file._id = result.insertedId;
            } else {
                let result = await collection.updateOne({ _id: this._id }, { $set: { ...file } });
                file._id = this._id;
            }

            this._file = file;
            this._id = new ObjectId(this._file._id);

            return this;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Destory
     */
    public async Destory(this: File): Promise<void> {
        try {
            if (!this._id) {
                throw 'not set id yet';
            }

            let db = await sharedMongoDB();

            let collection: Collection<IFile> = db.collection(this._collectionName);

            await collection.deleteOne({ _id: this._id });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get Src
     * @param file
     */
    public ToSrc(this: File): string {
        try {
            if (!this._id) {
                throw 'not set id yet';
            }

            let routing: string = this._collectionName;
            let routings: string[] = routing.split(/(?=[A-Z])/);

            routing = routings.map((n) => n.toLocaleLowerCase()).join('-');
            routing = `file/${routing}`;

            return `${routing}/${this._id}`;
        } catch (e) {
            throw e;
        }
    }
}
