import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";

export class TextureEntity extends Entity {
  activeModes = [GameMode.Normal];

  constructor(props: {
    texture?: PIXI.Texture;
    name   ?: string;
  }) {
    super({
      texture   : props.texture,
      collidable: false,
    });

    this.name = props.name || "unnamed texture someone should really name!";
  }

  interact = () => {}
  collide = () => {}
  update = (state: GameState) => {
  }

  isOnScreen = () => true
}
