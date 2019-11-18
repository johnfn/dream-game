import { GameState, GameMode } from "./state";
import { InteractableEntity } from "./library/interactable_entity";
import { C } from "./constants";

export class Door extends InteractableEntity {
  activeModes = [GameMode.Normal];

  constructor() {
    super({
      collidable: true,
      dynamic   : true,
    });
  }

  interactRange = C.INTERACTION_DISTANCE;
  interactText = "Open door";

  interact = () => {
    this.visible = false;
  };

  collide = () => {};

  update = (state: GameState) => {};

  isOnScreen = () => true
}
