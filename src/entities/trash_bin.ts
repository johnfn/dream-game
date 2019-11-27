import { GameState, GameMode } from "../state";
import { Texture } from "pixi.js";
import { InteractableEntity } from "../library/interactable_entity";
import { C } from "../constants";
import { Dialog } from "../dialog";
import { Character } from "../character";

export class TrashBin extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name = "TrashBin";
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

  canInteract = () => true;
  interact = (player: Character, state: GameState) => {
    Dialog.StartDialog(state, "%1%Some old trash.");
  };
  interactRange = C.INTERACTION_RANGE;
  interactText = () => "Search trash";
}
