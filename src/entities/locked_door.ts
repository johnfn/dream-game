import { GameState, GameMode } from "../state";
import { C } from "../constants";
import { Entity } from "../library/entity";
import { Dialog } from "../dialog";
import { Door } from "./door";

export class LockedDoor extends Door {
  activeModes = [GameMode.Normal];
  name        = "Locked Door";
  open        = false;
  locked      = true;

  interactRange = C.INTERACTION_RANGE;
  interactText(state: GameState): string {
    if (this.locked) {
      if (state.keyCount === 0) {
        return "Try door";
      } else {
        return "Unlock door";
      }
    } else {
      return super.interactText(state);
    }
  }

  canInteract = () => true;

  interact(other: Entity, gameState: GameState) {
    if (this.locked) {
      if (gameState.keyCount === 0) {
        Dialog.StartDialog(gameState, "%1%This door is locked!");
      } else {
        Dialog.StartDialog(gameState, "%1%You unlock the door. Once you finish unlocking it, you retrieve the key. Why would you expect otherwise? As you're retrieving it, the key falls down a nearby sewer.");

        gameState.keyCount--;
        this.locked = false;

        super.interact(other, gameState);
      }
    } else {
      super.interact(other, gameState)
    }
  };

  collide = () => {};

  update = (state: GameState) => {
  };
}
