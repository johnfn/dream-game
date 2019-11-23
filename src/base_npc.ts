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

    this.position.set(200, 200)
    this.sprite.width  = 50;
    this.sprite.height = 50;
  }

  interact = (player: Character, state: GameState) => {
    Dialog.StartDialog(state);
  };

  interactRange = C.INTERACTION_DISTANCE;
  interactText  = "Talk";
  canInteract   = () => true;

  collide = () => {}
  update = (state: GameState) => {
  };

  isOnScreen = () => true
}
