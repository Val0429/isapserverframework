export function padLeft(input: string | number, digits: number, letter: string = "0"): string {
    if (typeof input === 'number') input = input + "";
    return input.length >= digits ? input : Array(digits-input.length).fill(letter).join("") + input;
}