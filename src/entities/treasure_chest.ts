import { GameState, GameMode } from "../state";
import { InteractableEntity } from "../library/interactable_entity";
import { Entity } from "../library/entity";
import { C } from "../constants";
import { Texture } from "pixi.js";
import { Dialog } from "../dialog";

export class TreasureChest extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name = "TreasureChest";
  open = false;

  constructor(texture: Texture) {
    super({
      collidable: true,
      texture   ,
    });
  }

  collide = () => {};

  update = (state: GameState) => {

  };

  canInteract = () => true;

  interact(other: Entity, gameState: GameState) {
    if (this.open) {
      Dialog.StartDialog(gameState, "%1%This is an empty chest.");
    } else {
      this.open = true;

      Dialog.StartDialog(gameState, "%1%You open the chest!");
    }
  }

  interactRange = C.INTERACTION_RANGE;

  interactText = () => {
    if (this.open) {
      return "Inspect";
    } else {
      return "Open";
    }
  }
}
