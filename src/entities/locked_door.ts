import { GameState, GameMode } from "../state";
import { InteractableEntity } from "../library/interactable_entity";
import { C } from "../constants";
import { Entity } from "../library/entity";
import { Dialog } from "../dialog";

export class LockedDoor extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name = "Locked Door";
  open = false;

  constructor() {
    super({
      collidable: true,
    });
  }

  interactRange = C.INTERACTION_RANGE;
  interactText  = () => "Try door";
  canInteract   = () => !this.open;

  interact = (other: Entity, gameState: GameState) => {
    Dialog.StartDialog(gameState, "%1%This door is locked!");

    if (false) {
      this.open    = true;
      this.visible = false;

      this.setCollideable(false);
    }
  };

  collide = () => {};

  update = (state: GameState) => {
  };
}
