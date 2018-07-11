/**
 * Val: This is a special shell.
 * Not working like others, include it has no effect.
 */

var template = `
var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<I{0}>;
type OutputC = Restful.OutputC<I{0}>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new {0}(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<I{0}>;
type OutputR = Restful.OutputR<I{0}>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query({0});
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<I{0}>;
type OutputU = Restful.OutputU<I{0}>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query({0}).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [\`{0} <\${objectId} not exists.\`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<I{0}>;
type OutputD = Restful.OutputD<I{0}>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query({0}).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [\`{0} <\${objectId}> not exists.\`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
`;

import * as fs from 'fs';

export default function main(path: string, className: string) {
    var origin = fs.readFileSync(path, "UTF-8");
    var regex = /^.*Restful.CRUD.*$/mg;
    var data = origin.replace(regex, (a, b) => {
        return template.replace( /\{0\}/mg, className );
    });
    console.log(`CRUD resolved for path <${path}>.`);
    fs.writeFileSync(path, data, "UTF-8");
}