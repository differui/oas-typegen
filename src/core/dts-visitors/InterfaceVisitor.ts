import DtsVisitor from '@/core/DtsVisitor';
import { injectable } from 'inversify';
import { AST } from 'json-schema-to-typescript/dist/src/types/AST';

@injectable()
class InterfaceVisitor extends DtsVisitor {
  public names: Map<string, string> = new Map();

  public INTERFACE(ast: AST) {
    const { standaloneName } = ast;

    if (standaloneName) {
      ast.standaloneName = this.createValidName();
      this.names.set(standaloneName, ast.standaloneName);
    }
  }

  private createValidName() {
    return '';
  }
}

export default InterfaceVisitor;
