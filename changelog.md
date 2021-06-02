# [v2.03.04](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.03.04) (2021/03/10)

### Release Note:
* Update advantech license library.

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.03.03](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.03.03) (2021/03/05)

### Release Note:
* Remove QRCode service.
* Remove Pin Code service.
* Add copy certificates to assets.
* Add model helper.
* Add advantech license library.

### Note:
* Reinstall node modules.

### Workspace Adjustment:
* Update framework version in package.json of workspace.
* In **workspace/custom/helpers/model/index.ts**
  ```typescript
  export * from 'helpers/model';
  ```
* Remove **workspace/define/licenses/product-id.define.ts**
* Add **workspace/define/licenses/product-device.define.ts**
  ```typescript
  import { Config } from 'models/define/licenses/product-device';

  var productDevices: Config[] = [
    ['Camera', 'FRS Video Source'],
    ['Tablet', 'FR Tablet'],
  ];

  export default productDevices;
  ```
* Add **workspace/define/licenses/product-name.define.ts**
  ```typescript
  import { Config } from 'models/define/licenses/product-name';

  var productName: Config = 'Custom_Face_Entry';

  export default productName;
  ```
* Enum for license rename.
  ```typescript
  export enum ELicenseProductDeviceId {
    "Camera" = 1,
    "Tablet" = 2
  }
  export enum ELicenseProductDeviceName {
    "FRS Video Source" = 1,
    "FR Tablet" = 2
  }
  ```



# [v2.03.02](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.03.02) (2021/01/12)

### Release Note:
* Update nodemon package to @advantech/nodemon.
* Update compiler shell, delay config load time.

### Note:
* Reinstall node modules.

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.03.01](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.03.01) (2020/12/01)

### Release Note:
* Remove ast service response extra exception message
* Add trim in request parameter when type was string
* Remove auto send success response when use websocket

### Workspace Adjustment:
* Update framework version in package.json of workspace.
* Add send success response message when webscoket cgi
  In **workspace/cgi-bin/\*\*/*.ts**
  ```typescript
  action.ws({}, async (data) => {
    let _socket: Socket = data.socket;
    _socket.send({ statusCode: 200 });
  });
  ```



# [v2.03.00](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.03.00) (2020/12/01)

### Release Note:
* Remove winser related script in package.json.
* Remove default sgsms, sms, smtp config.
* Move cgi-bin_default and config_default into defaults folder.
* Add define related model.
* Update service-datetime package to v1.06.01.
* Update server-service-print package to v1.03.05.
* Update server-service-log package to v1.01.02.
* Add change log file.
* Add readme file.
* Update default server time cgi response format.

### Note:
* Reinstall node modules.

### Workspace Adjustment:
* Update framework version in package.json of workspace.
* Remove **workspace/config/default/sgsms.ts**, **workspace/config/default/sms.ts** and **workspace/config/default/smtp.ts**.
* Update default config interface reference path.  
  In **workspace/config/default/core.ts**
  ```typescript
  import { Config } from 'defaults/config/core';
  ```
  In **workspace/config/default/mongodb.ts**
  ```typescript
  import { Config } from 'defaults/config/mongodb';
  ```
  In **workspace/config/default/parse-server.ts**
  ```typescript
  import { Config } from 'defaults/config/parse-server';
  ```
* Update define interface reference path.  
  In **workspace/define/cgis/errors.define.ts**
  ```typescript
  import { Config } from 'models/define/cgis/errors';

  var errors: Config[] = [];

  export default errors;
  ```
  In **workspace/define/license/priduct-id.define.ts**
  ```typescript
  import { Config } from 'models/define/licenses/product-id';

  var productIds: Config[] = [
      ...
  ];

  export default productIds;
  ```
  In **workspace/define/userRoles/personRoles.define.ts**
  ```typescript
  import { Config } from 'models/define/userRoles/personRoles';

  var personRoles: Config[] = [];

  export default personRoles;
  ```
  In **workspace/define/userRoles/userRoles.define.ts**
  ```typescript
  import { Config } from 'models/define/userRoles/userRoles';

  var userRoles: Config[] = [
      ...
  ];

  export default userRoles;
  ```



# [v2.02.08](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.02.08) (2020/10/22)

### Release Note:
* Add default download license information cgi.
* Update response format in default get license list cgi.

### Note:
* Reinstall node modules.

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.02.07](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.02.07) (2020/10/12)

### Release Note:
* Fix reference error in server shell.

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.02.06](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.02.06) (2020/10/06)

### Release Note:
* Remove winser package.
* Return real exception message when use UserHelper Login function.
* Update the rule of BasicAuth middleware, default allow “SystemAdministrator” when permission was not defined.
* Update uncaughtException and unhandleRejection event of process, print log use error stack.
* Update error message format in Errors.throw function.

### Note:
* Reinstall node module.

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.02.05](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.02.05) (2020/09/17)

### Release Note:
* Fix ast service error when parse string to number.

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.02.04](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.02.04) (2020/09/14)

### Release Note:
* Update service-datetime package to v1.06.00.
* Add drop index function in helper.

### Note:
* Reinstall node module.

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.02.03](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.02.03) (2020/09/07)

### Release Note:
* Fix ast service error when type was object.

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.02.02](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.02.02) (2020/08/31)

### Release Note:
* Fix cgi core error, postpone send 200 opportunity.
* Add log in default server bye cgi.
* Add default container bye cgi.
* Add transform license define shell.
* Update server-service-print package to v1.03.04.
* Add base request model.
* Add base response model.
* Add license class in helper.
* Add default license cgi.
* Add copy license from assets folder in server shell.

### Note:
* Reinstall node module.

### Workspace Adjustment:
* Update framework version in package.json of workspace.
* Remove copy license in main file.
* Remove license cgi in **workspace/cgi-bin/license/index.ts** if no need overwirte.
* Add license product id define in **workspace/define/licenses/product-id.define.ts**.
  ```typescript
  import { Config } from 'models/define/licenses/product-id';

  var productIds: Config[] = [
      ['00255', 'FRS Video Source'],
      ['00257', 'FR Tablet'],
  ];

  export default productIds;
  ```
* Add export base request model and it is recommended to remove the duplicate.  
  In **workspace/custom/models/request/_index.ts**
  ```typescript
  export * from 'models/request/_index';
  ```
* Add export base response model and it is recommended to remove the duplicate.  
  In **workspace/custom/models/response/_index.ts**
  ```typescript
  export * from 'models/response/_index';
  ```
* Extends **License class** in license service.  
  In **workspace/custom/systems/license.ts**
  ```typescript
  import { License } from 'helpers/license';

  class Service extends License {
  ...
  ```



# [v2.02.01](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.02.01) (2020/08/24)

### Release Note:
* Add generate permission map and permission check interface in user role shell.
* Add middleware helper.
* Add basic auth and paging default value middleware.
* Add server-service-file package.
* Add default cgi.

### Note:
* Reinstall node module.

### Workspace Adjustment:
* Update framework version in package.json of workspace.
* Add default server cgi and it is recommended to remove the duplicate. If need overwrite some cgi, please add in **cgi-bin/** folder, it will overwrite base on same filename.
* Can uninstall server-service-file package in workspace if it version same with framework.
* Add import and export permission map and permission check interface and it is recommended to remove the duplicate.  
  in **workspace/define/userRoles/userPermission.define.ts**
  ```typescript
  import { RoleList, IPermissionMap, IPermissionCheck } from 'core/userRoles.gen';

  export { IPermissionMap, IPermissionCheck };
  ```
* Add default server cgi permission in define.  
  in **workspace/define/userRoles/userPermission.define.ts**
  ```typescript
  export const permissionServerApiR: IPermissionCheck = {
      [RoleList.SystemAdministrator]: true,
      [RoleList.Administrator]: false,
      [RoleList.TenantAdministrator]: false
   };
  export const permissionServerConfigR: IPermissionCheck = {
      [RoleList.SystemAdministrator]: true,
      [RoleList.Administrator]: false,
      [RoleList.TenantAdministrator]: false
  };
  export const permissionServerLogR: IPermissionCheck = {
      [RoleList.SystemAdministrator]: true,
      [RoleList.Administrator]: false,
      [RoleList.TenantAdministrator]: false
  };
  export const permissionServerChangeLogR: IPermissionCheck = {
      [RoleList.SystemAdministrator]: true,
      [RoleList.Administrator]: false,
      [RoleList.TenantAdministrator]: false
  };
  export const permissionServerByeR: IPermissionCheck = {
      [RoleList.SystemAdministrator]: true,
      [RoleList.Administrator]: false,
      [RoleList.TenantAdministrator]: false
  };
  ```
* Add export base middlewares and it is recommended to remove the duplicate.  
  in **workspace/custom/middlewares/index.ts**
  ```typescript
  export * from 'helpers/middlewares';
  ```
* Update paging request default value middle when use.
  ```typescript
  action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue()],
        ...
  ```



# [v2.01.02](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.01.02) (2020/07/24)

### Release Note:
* to be completed...

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.01.01](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.01.01) (2020/07/21)

### Release Note:
* to be completed...

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.00.03](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.00.03) (2020/07/16)

### Release Note:
* to be completed...

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.00.02](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.00.02) (2020/07/14)

### Release Note:
* to be completed...

### Workspace Adjustment:
* Update framework version in package.json of workspace.



# [v2.00.01](http://172.22.28.195:53000/product-repositories/framework-server/src/tag/v2.00.01) (2020/07/02)

### Release Note:
* to be completed...

### Note:
* Node.js v12.18.x

### Workspace Adjustment:
* Update framework version in package.json of workspace.
