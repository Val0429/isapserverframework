export const LogTitle = "FRS Edge Server";

export interface IFRSEdgeConfig {
    ip: string;
    port: number;
    ssl: boolean;
    account: string;
    password: string;
}

export interface IFRSEdgeServerConfig {
    frsEdge: IFRSEdgeConfig;
    debug?: boolean;
}

// export { RequestLoginReason, UserType, RecognizedUser, UnRecognizedUser } from './../../frs-service/libs/core';

export enum RequestLoginReason {
    SessionExpired
}

export enum UserType {
    UnRecognized = 0,
    Recognized = 1,
}

export interface RecognizedUser {
    type: UserType.Recognized,
    person_info: {
        fullname: string;
        employeeno: string;
    }
    last_recognized: {
        timestamp: number;
        face_id_number: string;
    }
    person_id: string;
    score: number;
    target_score: number;
    snapshot: string;
    channel: string;
    timestamp: number;
    verify_face_id: string;
    action_enable: number;
    request_client_param: string;
    groups: { name: string, group_id: string }[];
    face_feature: string;
    /**
     * valFaceId: Val added feature. to replace with previous same id.
     */
    /**
     * hint for this is the searched face.
     */
    search_ok?: boolean;
    /**
     * valFaceId: Val added feature. to replace with previous same id.
     */
    valFaceId?: number;
}

export interface UnRecognizedUser {
    type: UserType.UnRecognized,
    target_score: number;
    snapshot: string;
    channel: string;
    timestamp: number;
    verify_face_id: string;
    action_enable: number;
    request_client_param: string;
    highest_score: {
        fullname: string;
        face_id_number: string;
        score: number;
    }
    face_feature: string;
    /**
     * score: Val added feature. only /search will have score.
     */
    score?: number;
    /**
     * hint for this is the searched face.
     */
    search_ok?: boolean;
    /**
     * valFaceId: Val added feature. to replace with previous same id.
     */
    valFaceId?: number;
}
