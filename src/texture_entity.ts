import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";

export class TextureEntity extends Entity {
  activeModes = [GameMode.Normal];

  // just for debugging
  name: string;

  constructor(props: {
    texture?: PIXI.Texture;
    name   ?: string;
  }) {
    super({
      texture   : props.texture,
      collidable: true,
      dynamic   : true,
    });

    this.name = props.name || "unnamed texture someone should really name!";
  }

  interact = () => {}
  collide = () => {}
  update = (state: GameState) => {}

  isOnScreen = () => true
}
