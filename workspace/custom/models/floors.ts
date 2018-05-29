import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IFloors {
    floor: number;
    unitNo: string;
    phone: string[];
}
@registerSubclass() export class Floors extends ParseObject<IFloors> {}
////////////////////////////////////////////////////
