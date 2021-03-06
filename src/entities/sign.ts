import { GameState, GameMode } from "../state";
import { Texture } from "pixi.js";
import { InteractableEntity } from "../library/interactable_entity";
import { C } from "../constants";
import { Dialog, DialogSpeaker } from "../dialog";
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
    Dialog.StartDialog(state, [{
      speaker: DialogSpeaker.Sign,
      text   : "%1% 3F<br /> 2F<br />%%2%1F (you are here)%%1% 0F<br />-1F",
    }]);
  };
  interactRange = C.INTERACTION_RANGE;
  interactText = () => "Read sign";
}
