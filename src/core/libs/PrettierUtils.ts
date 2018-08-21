import { injectable } from 'inversify';
import { format, Options } from 'prettier';

@injectable()
class PrettierUtils {
  public format(code: string, options?: Options) {
    return format(code, options);
  }
}

export default PrettierUtils;
