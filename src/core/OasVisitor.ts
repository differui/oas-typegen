import { decorate, injectable } from 'inversify';
import { Oas20CompositeVisitor, OasCompositeVisitor } from 'oai-ts-core';

decorate(injectable(), OasCompositeVisitor);
decorate(injectable(), Oas20CompositeVisitor);

@injectable()
class OasVisitor extends Oas20CompositeVisitor {
}

export default OasVisitor;
