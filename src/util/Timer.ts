import { injectable } from 'inversify';

interface Record {
  id: string;
  startTimestamp: number;
  endTimestamp: number;
}

@injectable()
class Timer {
  private records: Map<string, Record> = new Map();

  public start(id: string) {
    this.records.set(id, {
      id,
      startTimestamp: Date.now(),
      endTimestamp: 0,
    });
  }

  public end(id: string) {
    if (!this.records.has(id)) {
      return;
    }
    (this.records.get(id) as Record).endTimestamp = Date.now();
  }

  public usage(id: string) {
    if (!this.records.has(id)) {
      return 0;
    }

    const {
      startTimestamp,
      endTimestamp,
    } = this.records.get(id) as Record;

    return endTimestamp
      ? endTimestamp - startTimestamp
      : 0;
  }
}

export default Timer;
