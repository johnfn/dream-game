import { KeyboardState } from "./library/keyboard";
import { Sprite } from "pixi.js";
import { C } from "./constants";

import * as PIXI from "pixi.js";
import { Dialog } from "./dialog";
import { DreamMap } from "./dream_map";

export enum GameMode {
  Normal,
  Dialog,
}

export class GameState {
  inDreamWorld     = false;
  keys             : KeyboardState;
  map             !: DreamMap;

  dreamMapLayer   !: Sprite;
  realityMapLayer !: Sprite;
  shader           : PIXI.Graphics;
  dialog          !: Dialog;

  // TODO: Maybe mode should be a stack?
  mode             : GameMode;
  
  constructor() {
    this.mode = GameMode.Normal
    this.keys = new KeyboardState();

    this.shader = new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    this.shader.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    this.shader.width = C.CANVAS_WIDTH;
    this.shader.height = C.CANVAS_HEIGHT;
  }
}
