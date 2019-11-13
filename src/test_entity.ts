import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { GameState } from "./state";

/**
 * Completely pointless entity purely for testing.
 */
export class TestEntity extends Entity {
  constructor() {
    super({
      texture   : PIXI.Texture.WHITE,
      collidable: true,
      dynamic   : true,
    });

    this.position.set(100, 50)
    this.sprite.width = 50;
    this.sprite.height = 50;
  }

  interact = () => {}
  collide = () => {}
  update = (state: GameState) => {}

  isOnScreen = () => true
}
