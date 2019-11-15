import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { GameState } from "./state";
import { TextEntity } from "./library/text_entity";

export class HeadsUpDisplay extends Entity {
  interactText: TextEntity;

  constructor() {
    super({
      texture   : PIXI.Texture.EMPTY,
      collidable: false,
      dynamic   : false,
    });

    this.interactText = new TextEntity(
      "%1%e: Nothing", {
        1: { color   : "white", fontSize: 18, align: "right" }
      }
    );

    this.interactText.x = 500;
    this.interactText.y = 0;

    this.addChild(this.interactText);
  }

  interact = () => {}
  collide = () => {}
  update = (state: GameState) => {}

  isOnScreen = () => true
}