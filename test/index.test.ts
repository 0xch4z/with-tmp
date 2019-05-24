import * as fs from 'fs-extra';
import fsCmp from 'fs-cmp';

import {
  withTmpdir,
  withinTmpdir,
  ERR_PREFIX_MUST_STRING,
  ERR_PREFIX_MUST_LENGTH,
  ERR_TASK_MUST_FUNC
} from '../src';

const noop = () => void 0;
const cwd = process.cwd();

const checkDirectoryExists = async (path: string) => {
  try {
    const stat = await fs.lstat(path);
    return stat.isDirectory();
  } catch (/* swallow ENOENT errors */ err) {
    return false;
  }
};

const expectDirectoryNotExists = async (dir: string) =>
  expect(await checkDirectoryExists(dir)).toBe(false);

const expectDirectoryExists = async (dir: string) =>
  expect(await checkDirectoryExists(dir)).toBe(true);

describe('withTmpdir', () => {
  test('should throw when prefix argument is not of type string', async () => {
    const prefix = 0x00 as never;
    await expect(withTmpdir(prefix, noop)).rejects.toThrowError(
      ERR_PREFIX_MUST_STRING
    );
  });

  test('should throw when prefix argument has no length', async () => {
    await expect(withTmpdir('', noop)).rejects.toThrowError(
      ERR_PREFIX_MUST_LENGTH
    );
  });

  test('should throw when task is not of type function', async () => {
    const task = undefined as never;
    await expect(withTmpdir('prefix', task)).rejects.toThrowError(
      ERR_TASK_MUST_FUNC
    );
  });

  test('should create a temporary directory and clean up after', async () => {
    let tmpdir;
    const task = jest.fn(async (dir: string) => {
      tmpdir = dir;
      await expectDirectoryExists(tmpdir);
    });

    await withTmpdir('test', task);
    expect(task).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledWith(tmpdir);
    await expectDirectoryNotExists(tmpdir);
  });

  test('should clean up temporary directory when task throws', async () => {
    let tmpdir;
    const err = new Error('test');
    const task = jest.fn(async (dir: string) => {
      tmpdir = dir;
      await expectDirectoryExists(tmpdir);
      throw err;
    });

    await expect(withinTmpdir('test', task)).rejects.toThrowError(err);
    expect(task).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledWith(tmpdir);
    await expectDirectoryNotExists(tmpdir);
  });
});

describe('withinTmpdir', () => {
  test('should create and change to a new temporary directory and restore after', async () => {
    let tmpdir;
    const task = jest.fn(async (dir: string) => {
      tmpdir = dir;
      expect(await fsCmp(process.cwd(), tmpdir)).toBe(true);
      await expectDirectoryExists(tmpdir);
    });

    expect(process.cwd()).toBe(cwd);
    await withinTmpdir('test', task);
    expect(task).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledWith(tmpdir);
    await expectDirectoryNotExists(tmpdir);
  });

  test('should clean up temporary directory and restore cwd when task throws', async () => {
    let tmpdir;
    const err = new Error('test');
    const task = jest.fn(async (dir: string) => {
      tmpdir = dir;
      expect(await fsCmp(process.cwd(), tmpdir)).toBe(true);
      await expectDirectoryExists(tmpdir);
      throw err;
    });

    expect(process.cwd()).toBe(cwd);
    await expect(withinTmpdir('test', task)).rejects.toThrowError(err);
    expect(task).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledWith(tmpdir);
    await expectDirectoryNotExists(tmpdir);
  });
});
