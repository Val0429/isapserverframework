/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

export function padLeft(input: string | number, digits: number, letter: string = "0"): string {
    if (typeof input === 'number') input = input + "";
    return input.length >= digits ? input : Array(digits-input.length).fill(letter).join("") + input;
}

export function padRight(input: string | number, digits: number, letter: string = "0"): string {
    if (typeof input === 'number') input = input + "";
    return input.length >= digits ? input : input + Array(digits-input.length).fill(letter).join("");
}