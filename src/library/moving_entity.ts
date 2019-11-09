import { Entity, EntityType } from "./entity";
import { Vector2 } from "./vector2";
import { Game } from "../game";
import { Texture } from "pixi.js";
import { GameState } from "../state";
import { Rect } from "./rect";

// Not currently used anywhere, just for experimenting.
export class MovingEntity extends Entity {
  entityType = EntityType.MovingEntity;

  private _velocity = Vector2.Zero;
  private _collidable: boolean;
  protected _maxSpeed = 50;

  constructor(props: {
    game: Game;
    texture: Texture;
    collidable: boolean;
  }) {
    super({
      ...props,
      dynamic: true
    });

    this._collidable = props.collidable;
  }

  public get velocity(): Vector2 {
    return this._velocity;
  }

  public set velocity(dir: Vector2) {
    this._velocity = dir;
  }

  public get maxSpeed(): number {
    return this._maxSpeed;
  }

  public update = (state: GameState) => {

  }

  // Currently just stops moving.
  collide = (other: Entity, intersection: Rect) => {
    // if (!this._collidable) return;

    // this.velocity = Vector2.Zero;
  };

  // It's just shy
  interact = (other: Entity) => {
    return;
  };
}