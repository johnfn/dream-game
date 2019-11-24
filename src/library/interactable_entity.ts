import { Entity } from "./entity";
import { Game } from "../game";
import { GameState } from "../state";
import { Texture } from "pixi.js";

export abstract class InteractableEntity extends Entity {
  constructor(props: {
    texture   ?: Texture;
    collidable : boolean;
  }) {
    super(props);

    Game.Instance.entities.interactable.push(this);
  }

  abstract interact(other: Entity, gameState: GameState): void;
  abstract interactRange: number;
  abstract interactText(state: GameState): string;
  abstract canInteract: () => boolean;
}
