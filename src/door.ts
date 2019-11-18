import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";

export class Door extends Entity {
  activeModes = [GameMode.Normal];

  constructor() {
    super({
      collidable: true,
      dynamic   : true,
    });
  }

  interact = () => {}
  collide = () => {}
  update = (state: GameState) => {}

  isOnScreen = () => true
}
