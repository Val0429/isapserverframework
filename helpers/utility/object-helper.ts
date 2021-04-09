/*
 * Created on Tue March 24 2021
 * Author: Val Liu
 * Copyright (c) 2021, iSAP Solution
 */

import { ExpressionWithTypeArguments } from "ts-morph";

export namespace ObjectHelper {
     /// remove the given keys
     export function Omit<T, U extends keyof T>(value: T, ...keys: U[]): Omit<T, U> {
         let result = { ...value };
         keys.forEach(key => delete result[key]);
         return result;
     }
     /// pick the given keys
     export function Pick<T, U extends keyof T>(value: T, ...keys: U[]): Pick<T, U> {
         return keys.reduce( (final, key) => {
             let val = value[key];
             if (val != undefined) final[key as any] = val;
             return final;
        }, {} ) as any;
     }
 
     export function equals(source: any, target: any): boolean {
         return JSON.stringify(source) === JSON.stringify(target);
     }
 
     export function deepClone<T>(source: T, hash?: any): T {
         if (!hash) hash = new WeakMap();
         let obj: any = source;
         if (Object(obj) !== obj) return obj; // primitives
         if (obj instanceof Set) return new Set(obj) as any; // See note about this!
         if (hash.has(obj)) return hash.get(obj); // cyclic reference
         const result =
             obj instanceof Date ? new Date(obj) :
                 obj instanceof File ? new File([obj], obj.name, { type: obj.type }) :
                     obj instanceof RegExp ? new RegExp(obj.source, obj.flags) :
                         obj.constructor ? new obj.constructor() : Object.create(null);
         hash.set(obj, result);
         if (obj instanceof Map)
             Array.from(obj, ([key, val]) =>
                 result.set(key, ObjectHelper.deepClone(val, hash))
             );
         return Object.assign(
             result,
             ...Object.keys(obj).map(key => ({
                 [key]: ObjectHelper.deepClone(obj[key], hash)
             }))
         );
     }
 
     export function GetValue(source: object, keys: string | string[]): any {
         if (typeof keys === "string") keys = keys.split(".");
         let val = source;
         for (let i=0; i<keys.length; ++i) {
             let key = keys[i];
             val = val[key];
             if (val == null) return;
         }
         return val;
     }
     export function SetValue(source: object, keys: string | string[], value: any) {
         if (typeof keys === "string") keys = keys.split(".");
         let val = source;
         let lastKey = keys[keys.length - 1];
         for (let i=0; i<keys.length-1; ++i) {
             let key = keys[i];
             val = val[key];
             if (val == null) return;
         }
         val[lastKey] = value;
     }
     export function DeleteValue(source: object, keys: string | string[]) {
          if (typeof keys === "string") keys = keys.split(".");
          let val = source;
          let lastKey = keys[keys.length - 1];
          for (let i=0; i<keys.length-1; ++i) {
              let key = keys[i];
              val = val[key];
              if (val == null) return;
          }
          delete val[lastKey];
      }
 }
 
 