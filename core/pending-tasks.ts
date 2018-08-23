import { makeReadyPromise } from 'helpers/utility/task-helper';

var {
    makeSubjectReady: makeServerReady,
    waitSubjectReady: serverReady,
} = makeReadyPromise();

export { makeServerReady, serverReady }

