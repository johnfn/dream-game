import { Game } from "./game";
import { Point } from "./library/point";
import { Rect } from "./library/rect";
import * as PIXI from "pixi.js";
import { C } from "./constants";
import { GameState } from "./state";

// TODO: probably make less of these methods abstract?
export abstract class Entity extends PIXI.Sprite {
  constructor(props: {
    game: Game;
    texture: PIXI.Texture;
    collidable: boolean;
    dynamic: boolean;
  }) {
    super(props.texture);

    if (props.collidable) {
      props.game.entities.collidable.push(this);
    } else {
      props.game.entities.static.push(this);
    }
  }

  abstract update: (state: GameState) => void;
  abstract collide: (other: Entity, intersection: Rect) => void;
  abstract interact: (other: Entity) => void;

  public get bounds(): Rect {
    const b = this.getBounds();
    return new Rect({
      x: b.x,
      y: b.y,
      w: b.width,
      h: b.height
    });
  }

  public get center(): Point {
    return new Point(this.position).add({
      x: this.width / 2,
      y: this.height / 2
    });
  }

  // Checks the center
  isOnScreen = () => {
    return (
      this.position.x > 0 &&
      this.position.x < C.CANVAS_WIDTH &&
      this.position.y > 0 &&
      this.position.y < C.CANVAS_HEIGHT
    );
  };
}

// Not currently used anywhere, just for experimenting.
export class BaseEntity extends Entity {
  private _direction: Point = Point.Zero;
  private _collidable: boolean;
  private _dynamic: boolean;
  private _maxSpeed: number = 50;

  constructor(props: {
    game: Game;
    texture: PIXI.Texture;
    collidable: boolean;
    dynamic: boolean;
  }) {
    super(props);

    this._collidable = props.collidable;
    this._dynamic = props.dynamic;

    this._direction = new Point({
      x: 2 * (0.5 - Math.random()),
      y: 2 * (0.5 - Math.random())
    });

    this.position = new PIXI.Point(
      C.CANVAS_WIDTH * Math.random(),
      C.CANVAS_HEIGHT * Math.random()
    );
  }

  public get direction(): Point {
    return this._direction;
  }

  public set direction(dir: Point) {
    this._direction = dir;
  }

  public get maxSpeed(): number {
    return this._maxSpeed;
  }

  // TODO: Use correct framerate??
  update = (gameState: GameState) => {
    if (!this._dynamic) return;
    this.position.x += (this.maxSpeed * this.direction.x) / 60;
    this.position.y += (this.maxSpeed * this.direction.y) / 60;
  };

  // Currently just stops moving.
  collide = (other: Entity, intersection: Rect) => {
    if (!this._collidable) return;
    this.direction = Point.Zero;
  };

  // It's just shy
  interact = (other: Entity) => {
    return;
  };
}
