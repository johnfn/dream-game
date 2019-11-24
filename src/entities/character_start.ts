import { GameState, GameMode } from "../state";
import { Entity } from "../library/entity";

export class CharacterStart extends Entity {
  activeModes = [GameMode.Normal];
  name = "CharacterStart";
  open = false;
  static Instance: CharacterStart;

  constructor() {
    super({
      collidable: false,
    });

    if (CharacterStart.Instance) {
      throw new Error("more than one character start")
    }

    CharacterStart.Instance = this;
  }

  collide = () => {};

  update = (state: GameState) => {

  };
}
