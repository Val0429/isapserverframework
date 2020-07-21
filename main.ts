/// <reference path="./typings/index.d.ts" />
"use strict";

/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import './helpers'

import 'parse-server';

import './core/alias';
import './core/create-file-index';

import { Log } from 'helpers/utility';

/// todo remove: log loading time
let trace = Log.SuccessTime(undefined, "Compiler");
import './core/compiler';
trace.end();

trace = Log.SuccessTime(undefined, 'AST Service');
import './services/ast-services/ast-client';
trace.end();

trace = Log.SuccessTime(undefined, 'Create Index');
import './core/create-index';
trace.end();

trace = Log.SuccessTime(undefined, 'Load Main Application');
import './core/main.gen';
trace.end();

trace = Log.SuccessTime(undefined, 'Load Workspace');
import './workspace/main';
trace.end();
