import * as Parse from 'parse/node';

export interface FaceItem {
    sourceid: string;
    name: string;
    groupname: string;
    image: string;
    quality: number;
    facewidth: number;
    faceheight: number;
    createtime: number;
}
export class PFace extends Parse.Object {
    constructor() {
        super('Faces');
    }

    get item(): FaceItem {
        return {
            sourceid: this.get("sourceid"),
            name: this.get("name"),
            groupname: this.get("groupname"),
            image: this.get("image"),
            quality: this.get("quality"),
            facewidth: this.get("facewidth"),
            faceheight: this.get("faceheight"),
            createtime: this.get("createtime")
        }
    }
}
Parse.Object.registerSubclass('Faces', PFace);