import { getDeep } from "./get-deep";

interface IFindCollectionIndexingUnit<T> {
    [key: string]: T;
}

interface IFindCollectionIndexing<T> {
    [indexField: string]: IFindCollectionIndexingUnit<T>;
}

interface IFindCollectionDiffConfig<Source, Target> {
    /// which fields inside source / target, should make index?
    indexFields?: string[];
    isAddedCallback: { (targetUnit: Target, indexing: IFindCollectionIndexing<Source|Target>): boolean };
    addedConverter: { (targetUnit: Target): Source };
    isModifiedCallback: { (sourceUnit: Source, indexing: IFindCollectionIndexing<Source|Target>): boolean };
    isDeletedCallback: { (sourceUnit: Source, indexing: IFindCollectionIndexing<Source|Target>): boolean };
}

interface IFindCollectionDiffResult<Source, Target> {
    added: Source[];
    modified: Source[];
    deleted: Source[];
}

export function buildCollectionIndex<T>(sources: T[], indexFields: string | string[]): IFindCollectionIndexing<T> {
    if (!Array.isArray(indexFields)) indexFields = [indexFields];
    let indexes: IFindCollectionIndexing<T> = {};
    for (let indexField of indexFields) {
        let index = indexes[indexField] = {};
        for (let source of sources) {
            let key = getDeep(source, indexField);
            if (key == null) continue;
            index[key] = source;
        }
    }
    return indexes;
}

export function findCollectionDiff<Source, Target>(sources: Source[], targets: Target[], config: IFindCollectionDiffConfig<Source, Target>): IFindCollectionDiffResult<Source, Target> {
    let { indexFields, isAddedCallback, addedConverter, isModifiedCallback, isDeletedCallback } = config;

    /// 1) make indexes
    let consolidate = indexFields
        /// consolidate
        .reduce((final, value: string) => {
            const regSource = /^source\./;
            const regTarget = /^target\./;
            if (regSource.test(value)) final.sources.push( value.replace(regSource, "") );
            else if (regTarget.test(value)) final.targets.push( value.replace(regTarget, "") );
            return final;
        }, {
            sources: [],
            targets: []
        });

    let indexes = {};
    consolidate.sources.forEach(sourceIndexstr => {
        let tmpIndex = buildCollectionIndex(sources, sourceIndexstr);
        Object.keys(tmpIndex).forEach(key => {
            indexes[`source.${key}`] = tmpIndex[key];
        });
    });
    consolidate.targets.forEach(targetIndexstr => {
        let tmpIndex = buildCollectionIndex(targets, targetIndexstr);
        Object.keys(tmpIndex).forEach(key => {
            indexes[`target.${key}`] = tmpIndex[key];
        });
    });

    /// 2) detect added
    let added = targets.filter(target => isAddedCallback(target, indexes))
                       .map(target => addedConverter(target));

    /// 3) detect modified & deleted
    let { deleted, todoConfirmSources } = sources.reduce((final, source) => {
        if (isDeletedCallback(source, indexes)) final.deleted.push(source);
        else final.todoConfirmSources.push(source);
        return final;
    }, {
        deleted: [],
        todoConfirmSources: []
    });
    let modified = todoConfirmSources.filter(source => isModifiedCallback(source, indexes));

    return {
        added,
        modified,
        deleted
    }
}



// import { findCollectionDiff } from 'helpers/utility/do-collection-diff';
// let sources = [
//     { objectId: "ABCDA", id: 1, name: "Val"},
//     { objectId: "ABCDB", id: 2, name: "Tina"},
//     { objectId: "ABCDC", id: 3, name: "George"},
//     { objectId: "ABCDD", id: 4, name: "Jasmine"},
//     { objectId: "ABCDE", id: 5, name: "Mark Hsu"},
// ];
// let targets = [
//     { id: 1, name: "Val" },
//     { id: 2, name: "Tina" },
//     { id: 3, name: "George Tsai" },
//     { id: 4, name: "Jasmine" },
//     { id: 6, name: "Angela Lin" }
// ];
// let diffs = findCollectionDiff(sources, targets, {
//     indexFields: ["source.id", "target.id"],
//     isAddedCallback: (target, indexes) => {
//         /// target.id not exists in source
//         console.log("the target?", indexes, target);
//         return !indexes["source.id"][target.id];
//     },
//     addedConverter: (target) => {
//         return new ParseObject(target);
//     },
//     isModifiedCallback: (source, indexes) => {
//         /// and source.name != target.name
//         let target = indexes["target.id"][source.id];
//         let sourceName = source.name;
//         source.name = target.name;
//         return sourceName !== target.name;
//     },
//     isDeletedCallback: (source, indexes) => {
//         /// if source.id not exists in target.id
//         let target = indexes["target.id"][source.id];
//         return !target;
//     }
// });
// console.log("the diffs!", diffs);
