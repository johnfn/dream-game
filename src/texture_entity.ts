import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";

export class TextureEntity extends Entity {
  activeModes = [GameMode.Normal];

  constructor(texture?: PIXI.Texture) {
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
