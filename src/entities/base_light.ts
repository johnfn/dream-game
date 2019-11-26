import { Entity } from "../library/entity";
import { GameState } from "../state";
import { CollisionGrid } from "../collision_grid";
import { Texture } from "pixi.js";

export abstract class BaseLight extends Entity {
  constructor(props: {
    collidable   : boolean;
    texture     ?: Texture;
    transparent ?: boolean;
    interactable?: boolean;
  }) {
    super({
      ...props,
      light: true,
    });
  }

  abstract updateLight(state: GameState, grid: CollisionGrid): void;
}