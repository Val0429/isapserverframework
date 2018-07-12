import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Events, IEvents,
    Restful, FileHelper, ParseObject
} from './../../../core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IEvents>;
type OutputR = Restful.OutputR<IEvents>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = Events.Query.get();
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType, Events.Query.filter(), Events.Query.tuner());
});
/// CRUD end ///////////////////////////////////

export default action;
