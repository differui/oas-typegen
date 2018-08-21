import Factory from '@/core/Factory';
import { injectable } from 'inversify';
import { Tapable } from 'tapable';

@injectable()
abstract class Plugin implements Tapable.Plugin {
  public abstract name: string;

  public apply(factory: Factory) {
    throw new Error('apply must be implement in plugin');
  }
}

export default Plugin;
