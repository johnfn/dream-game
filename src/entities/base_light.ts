import { Entity } from "../library/entity";
import { GameState } from "../state";
import { CollisionGrid } from "../collision_grid";

export abstract class BaseLight extends Entity {
  abstract updateLight(state: GameState, grid: CollisionGrid): void;
}