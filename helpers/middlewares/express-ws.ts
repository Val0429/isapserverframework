/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as expressWs from 'express-ws';

/// deprecated. not use in this project anymore.
/// changed to express-ws-routes.

export type WebSocketEvent = "message" | "close";
export interface WebSocketOnMessage {
    (data: string): void;
}
export interface WebSocketOnClose {
    (): void;
}
export interface WebSocketEventCallback {
    <T extends WebSocketEvent>(event: T,
       callback: (T extends "message" ? {(data: string): void} :
                  T extends "close" ? {(): void} :
                  {(): void}
                 )
       ): void;
}

export interface WebSocket {
    on: WebSocketEventCallback;
    send(data: string): void;
}

export { expressWs };