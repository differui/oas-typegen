import { injectable } from 'inversify';
import ora from 'ora';

@injectable()
class Spinner {
  private spinner = ora('Loading unicorns');

  public start(text: string) {
    this.spinner.start(text);
  }

  public stop() {
    this.spinner.stop();
  }

  public refresh(text: string) {
    this.spinner.text = text;
  }

  public succeed(text: string) {
    this.spinner.succeed(text);
  }

  public fail(text: string) {
    this.spinner.fail(text);
  }

  public warn(text: string) {
    this.spinner.warn(text);
  }

  public info(text: string) {
    this.spinner.info(text);
  }
}

export default Spinner;
