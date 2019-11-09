import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { Game } from "./game";
import { GameState } from "./state";

/**
 * Completely pointless entity purely for testing.
 */
export class TestEntity extends Entity {
  constructor(props: { game: Game; }) {
    super({
      game      : props.game,
      texture   : PIXI.Texture.WHITE,
      collidable: true,
      dynamic   : true,
    });

    this.x = 50;
    this.y = 0;
    this.width = 50;
    this.height = 50;
  }

  interact = () => {}
  collide = () => {}
  update = (state: GameState) => {}

  isOnScreen = () => true
}
