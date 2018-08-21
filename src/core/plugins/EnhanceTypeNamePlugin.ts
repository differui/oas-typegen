import Factory from '@/core/Factory';
import DefinitionFragment from '@/core/oas-fragments/DefinitionFragment';
import Plugin from '@/core/Plugin';
import { injectable } from 'inversify';
import md5 from 'md5';

@injectable()
class EnhanceTypeNamePlugin implements Plugin {
  public name: string = 'EnhanceTypeNamePlugin';
  private typeNameMap: Map<string, string> = new Map<string, string>();

  public apply(factory: Factory) {
    factory.hooks.createDefinitionFragment.tap(this.name, this.handleCreateDefinitionFragment.bind(this));
    factory.hooks.generate.tap(this.name, this.handleGenerate.bind(this));
  }

  private handleCreateDefinitionFragment(definitionFragment: DefinitionFragment) {
    const safeTitle = `MD${md5(definitionFragment.title).toUpperCase()}`;

    this.typeNameMap.set(safeTitle, definitionFragment.title);
    definitionFragment.document.title = safeTitle;
  }

  private handleGenerate(code: string) {
    Array.from(this.typeNameMap.entries()).map(([ key, value]) => {
      code = code.replace(new RegExp(key, 'gm'), value);
    });
    return code;
  }
}

export default EnhanceTypeNamePlugin;
