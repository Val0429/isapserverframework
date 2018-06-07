import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IFloors {
    floor: number;
    name: string;
    unitNo: string;
    phone: string[];
}
@registerSubclass() export class Floors extends ParseObject<IFloors> {}
////////////////////////////////////////////////////
