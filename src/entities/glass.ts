import { GameState, GameMode } from "../state";
import { Entity } from "../library/entity";
import { Texture } from "pixi.js";

export class Glass extends Entity {
  activeModes = [GameMode.Normal];
  name = "Glass";
  open = false;

  constructor(texture: Texture) {
    super({
      collidable: true,
      texture,
    });
  }

  collide = () => {};

  update = (state: GameState) => {

  };

  isOnScreen = () => true
}
