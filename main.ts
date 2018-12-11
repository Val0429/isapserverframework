/// <reference path="./typings/index.d.ts" />
"use strict";

import './core/alias';
import './core/create-file-index';

import { Log } from 'helpers/utility';
const LogTitle = "Startup";

/// todo remove: log loading time
Log.time(LogTitle, "Compiler");
import './core/compiler';
Log.timeEnd(LogTitle, "Compiler");

Log.time(LogTitle, "AST Service");
import './services/ast-services/ast-client';
Log.timeEnd(LogTitle, "AST Service");

Log.time(LogTitle, "Create Index");
import './core/create-index';
Log.timeEnd(LogTitle, "Create Index");

Log.time(LogTitle, "Scheduler Loader");
import './core/scheduler-loader';
Log.timeEnd(LogTitle, "Scheduler Loader");

Log.time(LogTitle, "Load Main Application");
import './core/main.gen';
Log.timeEnd(LogTitle, "Load Main Application");

Log.time(LogTitle, "Load Workspace");
import './workspace/main';
Log.timeEnd(LogTitle, "Load Workspace");

