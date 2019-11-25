import { Entity, EntityType } from "./entity";
import { Vector2 } from "./vector2";
import { Game } from "../game";
import { Texture } from "pixi.js";
import { GameState, GameMode } from "../state";
import { Rect } from "./rect";

export class MovingEntity extends Entity {
  activeModes = [GameMode.Normal];
  entityType  = EntityType.MovingEntity;

  private _velocity   = Vector2.Zero;
  protected _maxSpeed = 50;

  constructor(props: {
    game: Game;
    texture: Texture;
    collidable: boolean;
  }) {
    super({
      ...props,
    });

    this._collideable = props.collidable;
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