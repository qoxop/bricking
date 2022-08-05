import updateLog from 'log-update';

export const tempLog = (...texts: string[]) => updateLog(...texts);
export const keepLog = (...texts: string[]) => {
  updateLog(...texts);
  updateLog.done();
};
