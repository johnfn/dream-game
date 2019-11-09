import { KeyboardState } from "./library/keyboard";
import { TiledTilemap } from "./library/tilemap";

export class GameState {
  keys: KeyboardState;
  map!: TiledTilemap;

  constructor() {
    this.keys = new KeyboardState();
  }
}