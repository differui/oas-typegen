import { injectable } from 'inversify';
import { sync as resolveSync } from 'resolve';

@injectable()
class ModuleSystem {
  private loadingModules: Set<any> = new Set();

  public resolve(name: string, dirname: string = process.cwd()) {
    try {
      const pathname = resolveSync(name, {
        basedir: dirname,
      });

      return {
        name,
        pathname,
        module: this.require(pathname),
      };
    } catch (err) {
      throw new Error(`Plugin ${name} not found relative to ${dirname}`);
    }
  }

  public require(name: string) {
    if (this.loadingModules.has(name)) {
      throw new Error('dependency cycle detected');
    }
    try {
      this.loadingModules.add(name);
      return require(name);
    } finally {
      this.loadingModules.delete(name);
    }
  }
}

export default ModuleSystem;
