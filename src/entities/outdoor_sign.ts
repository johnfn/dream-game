import { GameState, GameMode } from "../state";
import { Texture } from "pixi.js";
import { InteractableEntity } from "../library/interactable_entity";
import { C } from "../constants";
import { Dialog, DialogSpeaker } from "../dialog";
import { Character } from "../character";

export class OutdoorSign extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name = "OutdoorSign";
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
        text   : "%1%Welcome to Slime Dream Lab, Inc!",
      }, 
      {
        speaker: DialogSpeaker.You,
        text   : "%1%...",
      },
      {
        speaker: DialogSpeaker.You,
        text   : "%1%What is Slime Dream Lab, Inc?",
      },
    ]);
  };
  interactRange = C.INTERACTION_RANGE;
  interactText = () => "Read sign";
}
