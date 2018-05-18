import * as expressWs from 'express-ws';

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