import { BehaviorSubject } from 'rxjs';

export function makeSubject() {
    var subject = new BehaviorSubject(false);
    var event = subject.filter( value => value );
    var makeSubjectReady = () => subject.next(true);
    var waitSubjectReady = (func) => {
        var subscription = event.do(() => {
            func();
            subscription.unsubscribe();
        }).subscribe();
    }
    return {
        makeSubjectReady,
        waitSubjectReady,
    }
}


export function makeReadyPromise<T = boolean>(defaultValue: T = undefined) {
    if (defaultValue === undefined) defaultValue = false as any;
    let subject = new BehaviorSubject<T>(defaultValue);
    let makeSubjectReady = (obj: T = undefined) => { obj = obj || true as any; subject.next(obj); }
    let waitSubjectReady = subject.filter( (value: any) => value !== undefined && value !== null && value !== false ).first().toPromise();
    return {
        makeSubjectReady,
        waitSubjectReady
    }
}