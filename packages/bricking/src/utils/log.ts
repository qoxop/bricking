import updateLog, { logUpdateStderr } from 'log-update';

export const error = (...texts: string[]) => logUpdateStderr(...texts);
export const tempLog = (...texts: string[]) => updateLog(...texts);
export const keepLog = (...texts: string[]) => {
  updateLog(...texts);
  updateLog.done();
};
