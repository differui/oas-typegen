import Factory from '@/core/Factory';
import Plugin from '@/core/Plugin';
import Spinner from '@/core/Spinner';
import * as identifier from '@/identifier';
import { inject, injectable } from 'inversify';

@injectable()
class LogPlugin implements Plugin {
  public name: string = 'LogPlugin';
  @inject(identifier.Spinner) private spinner: Spinner;

  public apply(factory: Factory) {
    factory.hooks.applyPlugins.tap(this.name, this.handleStart.bind(this, 'apply plugins'));
    factory.hooks.options.tap(this.name, this.handleProcess.bind(this, 'loading options'));
    factory.hooks.createDocument.tap(this.name, this.handleProcess.bind(this, 'creating oai document instance'));
    factory.hooks.createDefinitionFragment.tap(this.name, definitionFragment => this.handleProcess(`creating definition fragment: ${definitionFragment.title}`));
    factory.hooks.createRequestOperationFragment.tap(this.name, requestOperationFragment => this.handleProcess(`creating request operation fragment: ${requestOperationFragment.title}`));
    factory.hooks.createResponseOperationFragment.tap(this.name, responseOperationFragment => this.handleProcess(`creating response operation fragment: ${responseOperationFragment.title}`));
    factory.hooks.generate.tap(this.name, this.handleStop.bind(this, 'generating code'));
  }

  public handleProcess(text: string) {
    this.spinner.refresh(text);
  }

  public handleStart(text: string) {
    this.spinner.start(text);
  }

  public handleStop(text: string) {
    this.spinner.refresh(text);
    this.spinner.stop();
  }
}

export default LogPlugin;
