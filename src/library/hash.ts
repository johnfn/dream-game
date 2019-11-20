export class Hash<K extends { hash(): string }, V> {
  private _values: { [key: string]: V } = {};

  constructor() {

  }

  put(key: K, value: V) {
    this._values[key.hash()] = value;
  }

  get(key: K): V {
    return this._values[key.hash()];
  }
}

export class DefaultHash<K extends { hash(): string }, V> {
  private _values: { [key: string]: V } = {};
  private _makeDefault: () => V;

  constructor(makeDefaultValue: () => V) {
    this._makeDefault = makeDefaultValue;
  }

  put(key: K, value: V) {
    this._values[key.hash()] = value;
  }

  get(key: K): V {
    if (this._values[key.hash()] === undefined) {
      this._values[key.hash()] = this._makeDefault();
    } 

    return this._values[key.hash()];
  }
}