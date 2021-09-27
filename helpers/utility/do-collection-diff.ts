import { getDeep } from "./deep";
import { IndexedArray, TIndex } from "./indexed-array";
import { Log } from "./log";

const LogTitle = "DoCollectionDiff";
const DEBUG = false;

interface IIndexFields {
    sources: TIndex[];
    targets: TIndex[];
}

interface IFindCollectionIndexing<Source, Target> {
    sources: IndexedArray<Source>;
    targets: IndexedArray<Target>;
}

interface IFindCollectionDiffConfig<Source, Target> {
    /// which fields inside source / target, should make index?
    indexFields?: IIndexFields;
    isAddedCallback: { (targetUnit: Target, indexing: IFindCollectionIndexing<Source, Target>): boolean };
    addedConverter: { (targetUnit: Target): Source };
    isModifiedCallback: { (sourceUnit: Source, indexing: IFindCollectionIndexing<Source, Target>): boolean };
    isDeletedCallback: { (sourceUnit: Source, indexing: IFindCollectionIndexing<Source, Target>): boolean };
}

interface IFindCollectionDiffResult<Source, Target> {
    added: Source[];
    modified: Source[];
    deleted: Source[];
}

// export function buildCollectionIndex<T>(sources: T[], indexFields: string | string[]): IFindCollectionIndexing<T> {
//     if (!Array.isArray(indexFields)) indexFields = [indexFields];
//     let indexes: IFindCollectionIndexing<T> = {};
//     for (let indexField of indexFields) {
//         let index = indexes[indexField] = {};
//         for (let source of sources) {
//             let key = getDeep(source, indexField);
//             if (key == null) continue;
//             index[key] = source;
//         }
//     }
//     return indexes;
// }

export function findCollectionDiff<Source, Target>(sources: Source[], targets: Target[], config: IFindCollectionDiffConfig<Source, Target>): IFindCollectionDiffResult<Source, Target> {
    let { indexFields, isAddedCallback, addedConverter, isModifiedCallback, isDeletedCallback } = config;

    /// 1) make indexes
    let m1 = DEBUG ? Log.InfoTime(LogTitle, "New Indexed Array") : null;
    let indexes: IFindCollectionIndexing<Source, Target> = {
        sources: new IndexedArray(...sources),
        targets: new IndexedArray(...targets)
    };
    DEBUG && m1.end();

    m1 = DEBUG ? Log.InfoTime(LogTitle, "Add Indexes of Source & Target") : null;
    [ ["sources", sources], ["targets", targets] ]
        .forEach((o: [string, any[]]) => {
            let [instance, units] = o;
            let theIndexes = indexFields[instance];
            indexes[instance].addIndexes(theIndexes);
        });
    DEBUG && m1.end();

    /// 2) detect added
    m1 = DEBUG ? Log.InfoTime(LogTitle, "Check Added") : null;
    let added = targets.filter(target => isAddedCallback(target, indexes))
                       .map(target => addedConverter(target));
    DEBUG && m1.end();

    /// 3) detect modified & deleted
    m1 = DEBUG ? Log.InfoTime(LogTitle, "Check Deleted") : null;
    let { deleted, todoConfirmSources } = sources.reduce((final, source) => {
        if (isDeletedCallback(source, indexes)) final.deleted.push(source);
        else final.todoConfirmSources.push(source);
        return final;
    }, {
        deleted: [],
        todoConfirmSources: []
    });
    DEBUG && m1.end();

    m1 = DEBUG ? Log.InfoTime(LogTitle, "Check Modified") : null;
    let modified = todoConfirmSources.filter(source => isModifiedCallback(source, indexes));
    DEBUG && m1.end();

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
