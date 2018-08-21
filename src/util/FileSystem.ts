import { readFile, writeFile } from 'fs';
import { injectable } from 'inversify';
import { promisify } from 'util';
import YAML from 'yaml';

@injectable()
class FileSystem {
  public async readFile(src: string) {
    return (await promisify(readFile)(src, 'utf8')).toString();
  }

  public writeFile(dest: string, content: string) {
    return promisify(writeFile)(dest, content, 'utf8');
  }

  public async readJSON(src: string) {
    return JSON.parse((await this.readFile(src)));
  }

  public async readYAML(src: string) {
    return YAML.parse((await this.readFile(src)));
  }
}

export default FileSystem;
