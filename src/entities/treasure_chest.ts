import { GameState, GameMode } from "../state";
import { InteractableEntity } from "../library/interactable_entity";
import { Entity } from "../library/entity";
import { C } from "../constants";
import { Texture } from "pixi.js";
import { Dialog, DialogSpeaker } from "../dialog";

type TreasureChestContents =
  | "key"

export class TreasureChest extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name        = "TreasureChest";
  open        = false;
  contents    : TreasureChestContents;
  inDream     : boolean;

  constructor(
    texture  : Texture, 
    props    : { [key: string]: unknown },
    layerName: string,
  ) {
    super({
      collidable: true,
      texture   ,
    });

    this.inDream = layerName.startsWith("Dream Object");

    const contents = props.contents;

    if (!contents || typeof contents !== "string") {
      throw new Error("Treasure chest object in map with no contents!");
    }

    this.contents = contents as unknown as TreasureChestContents;
  }

  collide = () => {};

  update = (state: GameState) => {

  };

  canInteract = (state: GameState) => {
    if (this.inDream) {
      const blobs = state.getDreamBlobs();
      const touchesBlob = blobs.values().find(blob => blob.bounds().contains(this.positionVector())) !== undefined;

      return touchesBlob;
    } else {
      return true;
    }
  }

  giveItemToCharacter(gameState: GameState) {
    if (this.contents === "key") {
      gameState.keyCount += 1;
    }
  }

  interact(other: Entity, state: GameState) {
    if (this.open) {
      Dialog.StartDialog(state, [{
        speaker: DialogSpeaker.TreasureChest,
        text   : "%1%This is an empty chest",
      }]);
    } else {
      this.open = true;

      Dialog.StartDialog(state, [{
        speaker: DialogSpeaker.TreasureChest,
        text   : "%1%You open the chest! TODO say something more.",
      }]);

      this.giveItemToCharacter(state);
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
