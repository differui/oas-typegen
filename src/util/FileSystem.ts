import { readFile, readFileSync, writeFile } from 'fs';
import { injectable } from 'inversify';
import { promisify } from 'util';
import YAML from 'yaml';

@injectable()
class FileSystem {
  public async readFile(src: string) {
    return (await promisify(readFile)(src, 'utf8')).toString();
  }

  public readFileSync(src: string) {
    return readFileSync(src, 'utf8').toString();
  }

  public writeFile(dest: string, content: string) {
    return promisify(writeFile)(dest, content, 'utf8');
  }

  public async readJson(src: string) {
    return JSON.parse((await this.readFile(src)));
  }

  public readJsonSync(src: string) {
    return JSON.parse(this.readFileSync(src));
  }

  public async readYaml(src: string) {
    return YAML.parse((await this.readFile(src)));
  }

  public async readYamlSync(src: string) {
    return YAML.parse(this.readFileSync(src));
  }
}

export default FileSystem;
