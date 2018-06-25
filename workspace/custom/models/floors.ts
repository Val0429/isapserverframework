import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IFloors {
    /**
     * Which floor is this.
     */
    floor: number;

    /**
     * Name of this floor.
     */
    name?: string;

    /**
     * Map image of this floor.
     */
    image: Parse.File;
}
@registerSubclass() export class Floors extends ParseObject<IFloors> {}
////////////////////////////////////////////////////
