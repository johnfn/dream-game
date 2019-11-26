import { GameState, GameMode } from "../state";
import { Texture } from "pixi.js";
import { InteractableEntity } from "../library/interactable_entity";
import { C } from "../constants";
import { Dialog } from "../dialog";
import { Character } from "../character";

export class Sign extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name = "Sign";
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
    Dialog.StartDialog(state, "%1% 3F<br /> 2F<br /> 1F (you are here)<br /> 0F<br />-1F");
  };
  interactRange = C.INTERACTION_RANGE;
  interactText = () => "Read sign";
}
