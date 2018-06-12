import { IEvent } from './../events/events.base';
import { ParseObject } from './../../helpers/parse-server/parse-helper';

export class Schedulers {
    event: ParseObject<IEvent>;
    time: any;
    action: any;
}