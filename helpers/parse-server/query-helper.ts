/*
 * Created on Tue Apr 9 2021
 * Author: Val Liu
 * Copyright (c) 2021, iSAP Solution
 */

import * as lodash from "lodash";
import { ObjectHelper } from 'helpers/utility/object-helper';

type POA = Parse.Object<Parse.Attributes>;

export namespace QueryHelper {
    export interface IQueryConfigA {
        key: string;
        value: any;
        /// clone the query? default: false (ex: for query or)
        clone?: boolean;
    }
    export interface IQueryConfigB {
        data: object;
        pkey: string;
        /// if key is different with pkey
        key?: string;
        /// delete the pkey from data right after? default: false
        delete?: boolean;
        /// clone the query? default: false (ex: for query or)
        clone?: boolean;
    }
    function isConfigA(o): o is IQueryConfigA {
        return 'value' in o;
    }
    function isConfigB(o): o is IQueryConfigB {
        return 'data' in o;
    }
    function resolveConfigKV<T extends POA>(query: Parse.Query<T>, config: IQueryConfigA | IQueryConfigB): { query: Parse.Query<T>, key: string, value: any } {
        let key: string, value: any;
        if (isConfigA(config)) {
            key = config.key;
            value = config.value;

        } else {
            key = config.key || config.pkey;
            value = ObjectHelper.GetValue(config.data, config.pkey);
            if (config.delete) ObjectHelper.DeleteValue(config.data, config.pkey);
        }
        if (config.clone) query = lodash.cloneDeep(query);
        return { query, key, value };
    }

    /// regex match key with value
    export function regex<T extends POA>(query: Parse.Query<T>, config: IQueryConfigA | IQueryConfigB): Parse.Query<T> {
        var { query, key, value } = resolveConfigKV(query, config);
        return value == undefined ? query : query.matches(key, new RegExp(value), 'i');
    }
    
    /// match key equal to value
    export function equalTo<T extends POA>(query: Parse.Query<T>, config: IQueryConfigA | IQueryConfigB): Parse.Query<T> {
        var { query, key, value } = resolveConfigKV(query, config);
        return value == undefined ? query : query.equalTo(key, value);
    }

    /// match key contain one of the value
    export function containedIn<T extends POA>(query: Parse.Query<T>, config: IQueryConfigA | IQueryConfigB): Parse.Query<T> {
        var { query, key, value } = resolveConfigKV(query, config);
        return value == undefined ? query : query.containedIn(key, value);
    }
}
