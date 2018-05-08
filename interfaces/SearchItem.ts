export interface SearchParam {
    searchid: string;
    starttime: number;
    endtime: number;
    image: string;
    score: number;
}

export interface SearchInfo {
    searchid: string;
    status: "start" | "stop";
}

export interface SearchItem {
    searchid: string;
    status: "ok";
    sourceid: string;
    image: string;
    createtime: number;
    score: number;
}