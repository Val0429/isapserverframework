export { ServiceDatetimeClass as DateTime } from 'service-datetime';
import { ServiceDatetimeClass } from 'service-datetime';
export const DateTimeService = new ServiceDatetimeClass();

export { Log } from 'server-service-log';
import { Log } from 'server-service-log';
export const LogService = new Log();
LogService.logFileName = `${DateTimeService.toString(new Date(), 'YYYYMMDDHHmmss')}-{{type}}-{{date}}-{{index}}.log`;

export { Print } from 'server-service-print';
import { Print } from 'server-service-print';
export const PrintService = new Print(LogService);
