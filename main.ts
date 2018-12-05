/// <reference path="./typings/index.d.ts" />
"use strict";

import './core/alias';
import './core/create-file-index';

/// todo remove: log loading time
console.time("compiler");  /// 27
import './core/compiler';
console.timeEnd("compiler");

import './services/ast-services/ast-client';

console.time("create-index"); /// 562
import './core/create-index';
console.timeEnd("create-index");

console.time("scheduler-loader"); /// 21
import './core/scheduler-loader';
console.timeEnd("scheduler-loader");

console.time("main.gen");  /// 2774
import './core/main.gen';
console.timeEnd("main.gen");

console.time("workspace/main");  /// 6
import './workspace/main';
console.timeEnd("workspace/main");

