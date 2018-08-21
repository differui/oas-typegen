import { decorate, injectable } from 'inversify';
import { Tapable } from 'tapable';

decorate(injectable(), Tapable);

@injectable()
class Tap extends Tapable {
}

export default Tap;
