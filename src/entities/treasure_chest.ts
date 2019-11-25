import { GameState, GameMode } from "../state";
import { InteractableEntity } from "../library/interactable_entity";
import { Entity } from "../library/entity";
import { C } from "../constants";
import { Texture } from "pixi.js";
import { Dialog } from "../dialog";

type TreasureChestContents =
  | "key"

export class TreasureChest extends InteractableEntity {
  activeModes = [GameMode.Normal];
  name        = "TreasureChest";
  open        = false;
  contents    : TreasureChestContents;

  constructor(texture: Texture, props: { [key: string]: unknown }) {
    super({
      collidable: true,
      texture   ,
    });

    const contents = props.contents;

    if (!contents || typeof contents !== "string") {
      throw new Error("Treasure chest object in map with no contents!");
    }

    this.contents = contents as unknown as TreasureChestContents;
  }

  collide = () => {};

  update = (state: GameState) => {

  };

  canInteract = () => true;

  giveItemToCharacter(gameState: GameState) {
    if (this.contents === "key") {
      gameState.keyCount += 1;
    }
  }

  interact(other: Entity, gameState: GameState) {
    if (this.open) {
      Dialog.StartDialog(gameState, "%1%This is an empty chest.");
    } else {
      this.open = true;

      Dialog.StartDialog(gameState, "%1%You open the chest!");

      this.giveItemToCharacter(gameState);
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