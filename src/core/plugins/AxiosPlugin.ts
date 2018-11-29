import Factory from '@/core/Factory';
import { GeneratorOptions } from '@/core/Generator';
import Plugin from '@/core/Plugin';
import { injectable } from 'inversify';

@injectable()
class AxiosPlugin implements Plugin {
  public name: string = 'AxiosPlugin';

  public apply(factory: Factory) {
    factory.hooks.generate.tap(this.name, this.handleGenerate.bind(this));
  }

  public handleGenerate(code: string, options: GeneratorOptions) {
    return `
    ${this.generateImport(options)}
    ${this.generateInstance(options)}
    ${this.generateDispatch(options)}
    ${this.generateCode(code, options)}`;
  }

  private generateImport(options: GeneratorOptions) {
    if (options.language === 'js' && options.format === 'cjs') {
      return `var axios = require('axios')`;
    }
    if (options.language === 'ts') {
      return `import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';`;
    }
    return `import axios from 'axios'`;
  }

  private generateInstance(options: GeneratorOptions) {
    if (options.language === 'js' && options.format === 'cjs') {
      return `var axiosInstance = module.exports.axiosInstance = axios.create();`;
    }
    return `export const axiosInstance = axios.create();`;
  }

  private generateDispatch(options: GeneratorOptions) {
    switch (options.language) {
      case 'js':
        return `
          function dispatchRequest(method, url, config) {
            config = config || {};
            return axiosInstance.request({
              url: url,
              method: method,
              params: config.params,
              headers: config.headers,
              data: config.data,
            });
          }`;
      case 'ts':
        return `
          function dispatchRequest<T>(method: string, url: string, config?: AxiosRequestConfig) {
            return axiosInstance.request<T>({
              url,
              method,
              ...config,
            });
          }`;
      default:
        return '';
    }
  }

  private generateCode(code: string, options: GeneratorOptions) {
    switch (options.language) {
      case 'js':
        return code.replace(/Promise/g, `import('axios').AxiosPromise`);
      case 'ts':
        return code.replace(/Promise/g, 'AxiosPromise');
      default:
        return code;
    }
  }
}

export default AxiosPlugin;
