import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { GameState } from "./state";
import { TextEntity } from "./library/text_entity";
import { C } from "./constants";

export class HeadsUpDisplay extends Entity {
  interactText: TextEntity;

  constructor() {
    super({
      texture   : PIXI.Texture.EMPTY,
      collidable: false,
      dynamic   : false,
    });

    this.interactText = new TextEntity(
      `<div style="color: white; text-align: right; font-family: FreePixel; font-size: 20px">e: Interact</div>`,
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
