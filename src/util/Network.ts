import axios from 'axios';
import { injectable } from 'inversify';
import YAML from 'yaml';

@injectable()
class Network {
  public async downloadJSON(url: string) {
    return this.download(url);
  }

  public async downloadYAML(url: string) {
    return YAML.parse(await this.download(url));
  }

  private download(url: string) {
    return axios.get(url).then(result => result.data);
  }
}

export default Network;
