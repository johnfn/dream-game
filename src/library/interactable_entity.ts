import { Entity } from "./entity";
import { Game } from "../game";
import { GameState } from "../state";
import { Texture } from "pixi.js";

export abstract class InteractableEntity extends Entity {
  constructor(props: {
    game: Game;
    texture: Texture;
    collidable: boolean;
    dynamic: boolean;
  }) {
    super(props);

    props.game.entities.interactable.push(this);
  }

  abstract interact(other: Entity, gameState: GameState): void;
}
