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

export function makeReadyPromise() {
    let subject = new BehaviorSubject(false);
    let makeSubjectReady = () => subject.next(true);
    let waitSubjectReady = subject.filter( value => value ).first().toPromise();
    return {
        makeSubjectReady,
        waitSubjectReady
    }
}