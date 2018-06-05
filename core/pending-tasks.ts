import { makeSubject } from './../helpers/utility/task-helper';

var {
    makeSubjectReady: makeServerReady,
    waitSubjectReady: waitServerReady,
} = makeSubject();

export { makeServerReady, waitServerReady }

