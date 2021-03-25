/*
 * Created on Tue March 24 2021
 * Author: Val Liu
 * Copyright (c) 2021, iSAP Solution
 */


interface ObjectConstructor {
     /// remove the given keys
     Omit<T, U extends keyof T>(value: T, ...keys: U[]): Omit<T, U>;
     /// pick the given keys
     Pick<T, U extends keyof T>(value: T, ...keys: U[]): Pick<T, U>;
}

(Object as any).Omit = function<T, U extends keyof T>(value: T, ...keys: U[]) {
     let result = { ...value };
     keys.forEach(key => delete result[key]);
     return result;
};

(Object as any).Pick = function<T, U extends keyof T>(value: T, ...keys: U[]) {
     return keys.reduce( (final, key) => {
          let val = value[key];
          if (val != undefined) final[key as any] = val;
          return final;
     }, {} );
};
