/**
 * 文件处理工具
 */
import fs from 'fs';
import del from 'del';
import path from 'path';
import copy from 'cpy';
import yauzl from 'yauzl';
import yazl from 'yazl';
import tar from 'tar';

/**
 * 遍历目录中的文件
 * @param absoluteDir - 需要进行遍历的目录的绝对路径
 * @param relativeDir - 相对路径(保存其路径结构)
 *  ./
 *  ./a
 *  ./a/b
 *  ./a/b/c
 * @param callback - 回调函数
 */
function fileIterator(
  absoluteDir: string,
  relativeDir: string,
  // eslint-disable-next-line no-unused-vars
  callback: (paths: { absolute: string; relative: string }, buff: Buffer) => void,
) {
  const files = fs.readdirSync(absoluteDir, { withFileTypes: true }) || [];
  files.forEach((item) => {
    const absolute = path.join(absoluteDir, item.name);
    const relative = path.join(relativeDir, item.name);
    if (item.isFile()) {
      const buff = fs.readFileSync(path.join(absoluteDir, item.name));
      return callback({ absolute, relative }, buff);
    }
    if (item.isDirectory()) {
      fileIterator(absolute, relative, callback);
    }
  });
}

/**
 * 文件转化并传输
 * @param from - 来源
 * @param to - 目的地
 * @param transform - 转化方法
 * @returns
 */
function filesTransfer(
  from: string,
  to: string,
  // eslint-disable-next-line no-unused-vars
  transform: (name: string, data: Buffer) => Buffer|Promise<Buffer>,
): Promise<any> {
  const items = fs.readdirSync(from, { withFileTypes: true });
  if (!fs.existsSync(to)) fs.mkdirSync(to);
  const ps:Promise<any>[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const item of items) {
    const fromPath = path.join(from, item.name);
    const toPath = path.join(to, item.name);
    if (item.isFile()) {
      ps.push(new Promise<void>((resolve, reject) => {
        fs.readFile(fromPath, (rErr, data) => {
          if (rErr) return reject(rErr);
          Promise.resolve(transform(item.name, data)).then((newData) => {
            fs.writeFile(toPath, newData, (wErr) => {
              if (wErr) reject(wErr);
              resolve();
            });
          });
        });
      }));
    } else if (item.isDirectory()) {
      filesTransfer(fromPath, toPath, transform);
    }
  }
  return Promise.all(ps);
}

/**
 * zip 类
 */
class Zipper {
  private zipFile:yazl.ZipFile;

  private output: string;

  constructor(output:string) {
    this.output = output;
    this.zipFile = new yazl.ZipFile();
  }

  /**
     * 添加文件
     */
  add = (name: string, buff: Buffer) => {
    this.zipFile.addBuffer(buff, name);
  };

  /**
     * 输出 zip 包
     */
  finish = (buffArr?: any[]) => new Promise<void|Buffer>((resolve, reject) => {
    if (buffArr && buffArr instanceof Array) {
      this.zipFile.outputStream.on('data', (buf) => buffArr.push(buf));
      this.zipFile.outputStream.on('end', () => resolve(Buffer.concat(buffArr)));
    } else {
      this.zipFile.outputStream.pipe(fs.createWriteStream(this.output))
        .on('close', resolve)
        .on('error', reject);
    }
    this.zipFile.end();
  });

  static tarFolder<T extends string | any[]>(folder: string, dist: T) {
    return new Promise((resolve, reject) => {
      if (typeof dist === 'string') {
        tar.c({ gzip: true, file: dist }, [folder])
          .then(resolve)
          .catch(reject);
      } else {
        tar.c({ gzip: true }, [folder])
          .on('data', (buff) => dist.push(buff))
          .on('end', () => resolve(Buffer.concat(dist)))
          .on('error', reject);
      }
    });
  }

  /**
     * 压缩某个指定的目录
     * @param options.dir 压缩目录
     * @param options.prefix zip 包中的文件前缀，eg: 压缩前 /a.js  -> 解压后 /prefix/a.js,
     * @param options.output 输出目录
     * @param options.filter 过滤器(可选)
     * @returns Promise<void>
     */
  static doZip({
    dir, prefix, output, filter = (() => true),
  }:{
        dir: string
        prefix: string,
        output: string,
        // eslint-disable-next-line no-unused-vars
        filter?: (absolutePath: string) => boolean,
    }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const zipFile = new yazl.ZipFile();
      zipFile.outputStream.pipe(fs.createWriteStream(output))
        .on('close', resolve)
        .on('error', reject);
      fileIterator(dir, prefix, ({ absolute, relative }, buff) => {
        if (filter(absolute)) {
          zipFile.addBuffer(buff, relative);
        }
      });
      zipFile.end();
    });
  }

  /**
     * 解压 zip 包
     * @param options.zipPath zip 包的地址
     * @param options.to 解压目录
     * @returns
     */
  static unZip({ zipPath, to }: {
        zipPath:string,
        to: string
    }): Promise<void> {
    const rootName = path.parse(zipPath).name;
    const getFilePath = (_fileName: string) => {
      const fileName = _fileName.replace(`${rootName}/`, '');
      const filePath = path.join(to, `./${fileName}`);
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }
      return filePath;
    };
    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err: any, zipfile: any) => {
        if (err) return reject(err);
        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          // Directory file names end with '/'.
          if (/\/$/.test(entry.fileName)) return zipfile.readEntry();
          zipfile.openReadStream(entry, (_err:any, readStream:any) => {
            if (_err) throw _err;
            readStream.on('end', () => zipfile.readEntry());
            readStream.pipe(fs.createWriteStream(getFilePath(entry.fileName), { flags: 'wx' }));
          });
        });
        zipfile.on('close', resolve);
        zipfile.on('error', resolve);
      });
    });
  }
}

export {
  copy,
  del,
  fileIterator,
  filesTransfer,
  Zipper,
};
