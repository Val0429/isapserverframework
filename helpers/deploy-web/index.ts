import * as express from 'express';
import * as fs from 'fs';
import * as p from 'path';
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
                app.use((req, res, next) => {
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