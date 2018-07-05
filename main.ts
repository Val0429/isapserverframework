/// <reference path="./typings/index.d.ts" />
/// <reference path="./helpers/cgi-helpers/core.d.ts" />
"use strict";

console.log("todo remove: log loading time.");
console.time("compiler");  /// 27
import './core/compiler';
console.timeEnd("compiler");
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

import './services/ast-services/ast-client';