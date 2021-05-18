/*
 * Created on Tue Apr 9 2021
 * Author: Val Liu
 * Copyright (c) 2021, iSAP Solution
 */

import { padLeft } from "./pad-left";

export namespace DateHelper {
    export function dayStart(date?: Date): Date {
        let o = new Date(date);
        o.setHours(0,0,0,0);
        return o;
    }

    export function dayEnd(date?: Date): Date {
        let o = new Date(date);
        o.setHours(23,59,59,999);
        return o;
    }

    export function dayAdd(date: Date, days?: number): Date {
        let o = new Date(date);
        o.setDate(o.getDate() + days);
        return o;
    }

    export function equals(date1: Date, date2: Date): boolean {
        return !(date1 < date2) && !(date2 < date1);
    }

    /**
     * Convert string array to RegExp
     * @param array
     */
    function Array2RegExp(...array: string[][]): RegExp {
        let strs: string[] = [];
        strs = strs.concat(...array);
        let regex: string = '';
        for (let str of strs) {
            regex += `${str}|`;
        }
        regex = regex.replace(/\|$/, '');
        return new RegExp(regex, 'g');
    }    
    export function format(dateTime: Date, format: string): string {
        let _formats: string[] = ['dddd', 'ddd', 'DD', 'D', 'hh', 'h', 'HH', 'H', 'mm', 'm', 'MMMM', 'MMM', 'MM', 'M', 'ss', 's', 'A', 'a', 'YYYY', 'YY', 'ZZ', 'Z'];
        let _timeNames: string[] = ['am', 'pm', 'AM', 'PM'];

        let regex: RegExp = Array2RegExp(_formats);

        let formats: string[] = format.match(regex) || [];
        let spaces: string[] = format.split(regex);

        let year: number = dateTime.getFullYear();
        let month: number = dateTime.getMonth();
        let day: number = dateTime.getDay();
        let date: number = dateTime.getDate();
        let hour: number = dateTime.getHours();
        let minute: number = dateTime.getMinutes();
        let second: number = dateTime.getSeconds();
        let offset: number = dateTime.getTimezoneOffset() + 30;

        let dateStr: string = '';
        for (let i: number = 0; i < spaces.length; i++) {
            switch (formats[i - 1]) {
                case 'dddd':
                    /// weekday long
                    dateStr += dateTime.toLocaleDateString('en-gb', { weekday: 'long' });
                    break;
                case 'ddd':
                    /// weekday short
                    dateStr += dateTime.toLocaleDateString('en-gb', { weekday: 'short' });
                    break;
                case 'DD':
                    dateStr += padLeft(date.toString(), 2, '0');
                    break;
                case 'D':
                    dateStr += date.toString();
                    break;
                case 'hh':
                    dateStr += padLeft((hour % 12 || 12).toString(), 2, '0');
                    break;
                case 'h':
                    dateStr += (hour % 12 || 12).toString();
                    break;
                case 'HH':
                    dateStr += padLeft(hour.toString(), 2, '0');
                    break;
                case 'H':
                    dateStr += hour.toString();
                    break;
                case 'mm':
                    dateStr += padLeft(minute.toString(), 2, '0');
                    break;
                case 'm':
                    dateStr += minute.toString();
                    break;
                case 'MMMM':
                    dateStr += dateTime.toLocaleDateString('en-gb', { month: 'long' });
                    break;
                case 'MMM':
                    dateStr += dateTime.toLocaleDateString('en-gb', { month: 'short' });
                    break;
                case 'MM':
                    dateStr += padLeft((month + 1).toString(), 2, '0');
                    break;
                case 'M':
                    dateStr += (month + 1).toString();
                    break;
                case 'ss':
                    dateStr += padLeft(second.toString(), 2, '0');
                    break;
                case 's':
                    dateStr += second.toString();
                    break;
                case 'A':
                    dateStr += hour < 12 ? _timeNames[2] : _timeNames[3];
                    break;
                case 'a':
                    dateStr += hour < 12 ? _timeNames[0] : _timeNames[1];
                    break;
                case 'YYYY':
                    dateStr += year.toString();
                    break;
                case 'YY':
                    dateStr += year.toString().slice(2);
                    break;
                case 'ZZ':
                    dateStr += (offset > 0 ? '-' : '+') + padLeft((Math.floor(Math.abs(offset) / 60) * 100 + (Math.abs(offset) % 60)).toString(), 4, '0');
                    break;
                case 'Z':
                    dateStr += `${offset > 0 ? '-' : '+'}${Math.abs(offset / 60).toString()}`;
                    break;
            }

            dateStr += spaces[i];
        }

        return dateStr;
    }
}
