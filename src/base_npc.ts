import * as PIXI from "pixi.js";

import { GameState } from "./state";
import { InteractableEntity } from "./library/interactable_entity";
import { Character } from "./character";

/**
 * Completely pointless entity purely for testing.
 */
export class BaseNPC extends InteractableEntity {
  constructor() {
    super({
      texture   : PIXI.Texture.WHITE,
      collidable: true,
      dynamic   : true,
    });

    this.position.set(200, 200)
    this.sprite.width  = 50;
    this.sprite.height = 50;
  }

  interact = (player: Character, state: GameState) => {
    console.log("My GOD!");
  };

  collide = () => {}
  update = (state: GameState) => {}

  isOnScreen = () => true
}
