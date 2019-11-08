import { Point } from "./library/point";
import { Entity } from "./entity";
import * as PIXI from "pixi.js";

export class Camera {
  private _position: Point = Point.Zero;
  private _target: Entity | undefined;
  private _stage: PIXI.Container;
  private _width: number;
  private _height: number;

  constructor(props: { stage: PIXI.Container; width: number; height: number }) {
    this._stage = props.stage;
    this._width = props.width;
    this._height = props.height;
  }

  follow(e: Entity) {
    this._target = e;
  }

  public get center(): Point {
    return new Point({
      x: this._position.x + this._width / 2,
      y: this._position.y + this._height / 2
    });
  }

  centerOn = (position: Point) => {
    this._position = position.subtract({
      x: this._width / 2,
      y: this._height / 2
    });
  };

  update = () => {
    if (this._target) {
      this.centerOn(new Point(this._target.center));
    }
    this._stage.position = new PIXI.Point(-this._position.x, -this._position.y);
  };
}
