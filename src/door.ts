import { GameState, GameMode } from "./state";
import { InteractableEntity } from "./library/interactable_entity";
import { C } from "./constants";

export class Door extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name = "Door";
  open = false;

  constructor() {
    super({
      collidable: true,
      dynamic   : true,
    });
  }

  interactRange = C.INTERACTION_DISTANCE;
  interactText  = "Open door";
  canInteract   = () => !this.open;

  interact = () => {
    this.open    = true;
    this.visible = false;

    this.setCollideable(false);
  };

  collide = () => {};

  update = (state: GameState) => {
  };

  isOnScreen = () => true
}
