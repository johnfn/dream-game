import { Entity } from "./entity";
import { Game } from "../game";
import { GameState } from "../state";

export abstract class InteractableEntity extends Entity {
    abstract interact(other: Entity, gameState: GameState): void;
}