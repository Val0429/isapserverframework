/*
 * Created on Tue June 1 2021
 * Author: Val Liu
 * Copyright (c) 2021, iSAP Solution
 */
 
function toFixedNumber(num, digits, base = 10){
    var pow = Math.pow(base, digits);
    return Math.round(num*pow) / pow;
}

export namespace NumberHelper {
    export function toFixedNumber(num: number, digits: number, base: number = 10){
        var pow = Math.pow(base, digits);
        return Math.round(num*pow) / pow;
    }
}
