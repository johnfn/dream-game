import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";

/**
 * Completely pointless entity purely for testing.
 */
export class TestEntity extends Entity {
  activeModes = [GameMode.Normal];

  constructor(texture: PIXI.Texture) {
    super({
      texture   : texture,
      collidable: true,
      dynamic   : true,
    });
  }

  interact = () => {}
  collide = () => {}
  update = (state: GameState) => {}

  isOnScreen = () => true
}
