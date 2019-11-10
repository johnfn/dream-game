import { KeyboardState } from "./library/keyboard";
import { TiledTilemap } from "./library/tilemap";
import { Sprite } from "pixi.js";

export class GameState {
  inDreamWorld    = false;
  keys            : KeyboardState;
  map            !: TiledTilemap;

  dreamMapLayer  !: Sprite;
  realityMapLayer!: Sprite;

  constructor() {
    this.keys = new KeyboardState();
  }
}