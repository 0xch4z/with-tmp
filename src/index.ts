import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { promisify } from 'util';

import rimraf = require('rimraf');

const rimrafAsync = promisify(rimraf);

export const ERR_PREFIX_MUST_STRING = 'prefix must be of type string';
export const ERR_PREFIX_MUST_LENGTH = 'prefix must not be an empty string';
export const ERR_TASK_MUST_FUNC = 'task must be of type function';

const validateArgs = (prefix: any, task: any) => {
  if (typeof prefix !== 'string') {
    throw new TypeError(ERR_PREFIX_MUST_STRING);
  }

  if (!prefix.length) {
    throw new Error(ERR_PREFIX_MUST_LENGTH);
  }

  if (typeof task !== 'function') {
    throw new TypeError(ERR_TASK_MUST_FUNC);
  }
};

export type TmpdirReciever = (dir: string) => Promise<void> | void;
export type WithTmpdirFunction = (
  prefix: string,
  task: TmpdirReciever
) => Promise<void>;

/**
 *
 * @param prefix prefix of temporary directory to create
 * @param task function to invoke with temporary directory created
 */
export const withTmpdir: WithTmpdirFunction = async (prefix, task) => {
  validateArgs(prefix, task);
  const dirPrefix = path.join(os.tmpdir(), prefix);
  const dir = await fs.mkdtemp(dirPrefix);

  try {
    await task(dir);
  } finally {
    await rimrafAsync(dir);
  }
};

/**
 *
 * @param prefix prefix of temporary directory to create
 * @param task function to invoke within the context of the temporary directory
 */
export const withinTmpdir: WithTmpdirFunction = (prefix, task) => {
  const originalCwd = process.cwd();
  const wrappedTask: TmpdirReciever = async dir => {
    process.chdir(dir);
    try {
      await task(dir);
    } finally {
      process.chdir(originalCwd);
    }
  };

  return withTmpdir(prefix, wrappedTask);
};

export default withTmpdir;
