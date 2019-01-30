/// <reference path="./typings/index.d.ts" />
"use strict";

import 'parse-server';

import './core/alias';
import './core/create-file-index';

import { Log } from 'helpers/utility';
const LogTitle = "Startup";

/// todo remove: log loading time
Log.TraceTime(LogTitle, "Compiler");
import './core/compiler';
Log.TraceTimeEnd(LogTitle, "Compiler");

Log.TraceTime(LogTitle, "AST Service");
import './services/ast-services/ast-client';
Log.TraceTimeEnd(LogTitle, "AST Service");

Log.TraceTime(LogTitle, "Create Index");
import './core/create-index';
Log.TraceTimeEnd(LogTitle, "Create Index");

Log.TraceTime(LogTitle, "Scheduler Loader");
import './core/scheduler-loader';
Log.TraceTimeEnd(LogTitle, "Scheduler Loader");

Log.TraceTime(LogTitle, "Load Main Application");
import './core/main.gen';
Log.TraceTimeEnd(LogTitle, "Load Main Application");

Log.TraceTime(LogTitle, "Load Workspace");
import './workspace/main';
Log.TraceTimeEnd(LogTitle, "Load Workspace");

