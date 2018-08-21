import Plugin from '@/core/Plugin';
import { injectable } from 'inversify';

@injectable()
class AssertTypeCollision extends Plugin {
  public name: string = 'AssertTypeCollision';
}

export default AssertTypeCollision;
