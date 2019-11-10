import { KeyboardState } from "./library/keyboard";
import { TiledTilemap } from "./library/tilemap";
import { Sprite } from "pixi.js";
import { C } from "./constants";

import * as PIXI from "pixi.js";

export class GameState {
  inDreamWorld    = false;
  keys            : KeyboardState;
  map            !: TiledTilemap;

  dreamMapLayer  !: Sprite;
  realityMapLayer!: Sprite;
  shader: PIXI.Graphics;

  constructor() {
    this.keys = new KeyboardState();

    this.shader = new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    this.shader.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    this.shader.width = C.CANVAS_WIDTH;
    this.shader.height = C.CANVAS_HEIGHT;
  }
}
