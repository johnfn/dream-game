import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { GameState } from "./state";
import { BaseTextEntity } from "./library/base_text_entity";
import { C } from "./constants";

export class HeadsUpDisplay extends Entity {
  interactText: BaseTextEntity;

  constructor() {
    super({
      texture   : PIXI.Texture.EMPTY,
      collidable: false,
      dynamic   : false,
    });

    this.interactText = new BaseTextEntity(
      `<div style="color: white; text-align: right; font-family: FreePixel; font-size: 18px">e: Interact</div>`,
      C.CANVAS_WIDTH,
      100
    );

    this.addChild(this.interactText);
  }

  interact = () => {}
  collide = () => {}
  update = (state: GameState) => {}

  isOnScreen = () => true
}
