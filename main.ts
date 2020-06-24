/// <reference path="./typings/index.d.ts" />
"use strict";

/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import 'parse-server';

import './core/alias';
import './core/create-file-index';

import { Log } from 'helpers/utility';
const LogTitle = "Startup";

/// todo remove: log loading time
let trace = Log.TraceTime(LogTitle, "Compiler");
import './core/compiler';
trace.end();

trace = Log.TraceTime(LogTitle, "AST Service");
import './services/ast-services/ast-client';
trace.end();

trace = Log.TraceTime(LogTitle, "Create Index");
import './core/create-index';
trace.end();

trace = Log.TraceTime(LogTitle, "Load Main Application");
import './core/main.gen';
trace.end();

trace = Log.TraceTime(LogTitle, "Load Workspace");
import './workspace/main';
trace.end();
