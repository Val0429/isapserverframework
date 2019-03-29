import * as express from 'express';
import { Request } from '~express/lib/request';
import * as fs from 'fs';
import * as p from 'path';
import * as url from 'url';
import { Config } from 'core/config.gen';
import { expressWsRoutes } from 'helpers/middlewares/express-ws-routes';

function deployWeb(directory: string, port: number);
function deployWeb(directory: string, app: express.Application);
function deployWeb(directory: string, appOrPort: express.Application | number) {
    let app: express.Application;
    function handle() {
        let webPath = directory;
        fs.exists(webPath, (exists) => {
            if (!exists) return;
            app.use('/', express.static(webPath));
            let webIndexPath = p.resolve(webPath, 'index.html');
            fs.exists(webIndexPath, (exists) => {
                if (!exists) return;
                app.use(async (req: Request, res, next) => {
                    do {
                        /// detect in cgi-bin
                        let uri = url.parse(!Config.core.cgiPath ? req.originalUrl : req.originalUrl.replace(`/${Config.core.cgiPath}`, ''));
                        let paths = uri.pathname.split('/');
                        let curi = paths.length > 1 ? paths[1] : null;
                        if (!curi) break;   /// should not happen
                        let path = p.resolve(__dirname, "../../workspace/cgi-bin", curi);
                        let exists = await Promise.all([
                            new Promise( (resolve, reject) => fs.exists(path, (exists) => resolve(exists)) ),
                            new Promise( (resolve, reject) => fs.exists(`${path}.ts`, (exists) => resolve(exists)) )
                        ]);
                        if (exists[0] || exists[1]) return next();

                    } while(0);
                    /// redirect to root!
                    res.sendFile(webIndexPath);
                });
            });
        });
    }
    if (typeof appOrPort === 'number') {
        app = expressWsRoutes();
        handle();
        app.listen(appOrPort);

    } else {
        app = appOrPort;
        handle();
    }
}

export { deployWeb };