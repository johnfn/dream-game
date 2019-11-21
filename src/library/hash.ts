export class HashSet<K extends { hash(): string }> {
  private _values: HashMap<K, K>;

  constructor() {
    this._values = new HashMap<K, K>();
  }

  put(key: K): void {
    this._values.put(key, key);
  }

  get(key: K): boolean {
    return this._values.get(key) !== undefined;
  }

  keys(): K[] {
    return this._values.values()
  }
}

export class HashMap<K extends { hash(): string }, V> {
  private _values: { [key: string]: V } = {};

  constructor() {

  }

  put(key: K, value: V) {
    this._values[key.hash()] = value;
  }

  get(key: K): V {
    return this._values[key.hash()];
  }

  values(): V[] {
    return Object.keys(this._values).map(key => this._values[key]);
  }
}

export class DefaultHashMap<K extends { hash(): string }, V> {
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

