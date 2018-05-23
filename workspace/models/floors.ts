import { registerSubclass, AsParseObject } from './../../helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IFloors {
    floor: number;
    unitNo: string;
    phone: string[];
}
@registerSubclass() export class Floors extends AsParseObject("Floors")<IFloors> {}
////////////////////////////////////////////////////
