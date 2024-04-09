export class KKVRecord<T extends { key: string | number }> implements Record<string | number, T> {
  [ikey: string | number]: T;
  static push<T extends { key: string | number }>(record: KKVRecord<T>, tList: T[]) {
    for (const obj of tList as T[]) record[obj.key] = obj;
  }
  constructor(tList?: Array<T>) {
    if (tList !== void 0) KKVRecord.push(this, tList);
  }
}
