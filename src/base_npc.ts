import * as PIXI from "pixi.js";

import { GameState, GameMode } from "./state";
import { InteractableEntity } from "./library/interactable_entity";
import { Character } from "./character";
import { Dialog } from "./dialog";
import { C } from "./constants";

export class BaseNPC extends InteractableEntity {
  activeModes = [GameMode.Normal];

  constructor() {
    super({
      texture   : PIXI.Texture.WHITE,
      collidable: true,
    });

    this.position.set(500, 500);

    this.sprite.width  = 50;
    this.sprite.height = 50;
  }

  interact = (player: Character, state: GameState) => {
    Dialog.StartDialog(state, [{
      speaker: "Trash Can",
      text: "%1%Hello! I am an NPC.",
    }]);
  };

  interactRange = C.INTERACTION_RANGE;
  interactText  = () => "Talk";
  canInteract   = () => true;

  collide = () => {}
  update = (state: GameState) => {
  };
}
