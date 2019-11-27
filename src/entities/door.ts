import { GameState, GameMode } from "../state";
import { InteractableEntity } from "../library/interactable_entity";
import { C } from "../constants";
import { Entity } from "../library/entity";
import { Dialog, DialogSpeaker } from "../dialog";

export class Door extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name = "Door";
  open = false;

  constructor() {
    super({
      collidable: true,
    });
  }

  interactRange = C.INTERACTION_RANGE;
  interactText(state: GameState): string {
    if (this.open) {
      return "Close"
    } else {
      return "Open";
    }
  }

  canInteract = () => true;

  interact(other: Entity, state: GameState) {
    if (this.open) {
      if (other.collisionBounds(state).intersects(this.collisionBounds(state))) {
        Dialog.StartDialog(state, [{
          speaker: DialogSpeaker.DoorAngry,
          text   : "%1%What? Close the door? On myself? NO!!",
        }]);
      } else {
        this.open = false;
        this.setCollideable(true);
      }
    } else {
      this.open = true;
      this.setCollideable(false);
    }
  };

  collide = () => {};

  update = (state: GameState) => {
  };
}
