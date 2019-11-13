import { Vector2 } from "./library/vector2";
import { Entity } from "./library/entity";
import * as PIXI from "pixi.js";

export class FollowCamera {
  private _position: Vector2 = Vector2.Zero;
  private _target: Entity;
  private _stage: PIXI.Container;
  private _width: number;
  private _height: number;

  constructor(props: { stage: PIXI.Container; followTarget: Entity, width: number; height: number }) {
    this._stage = props.stage;
    this._width = props.width;
    this._height = props.height;
    this._target = props.followTarget;
    this.centerOn(new Vector2(this._target.position));
  }

  public get center(): Vector2 {
    return new Vector2({
      x: this._position.x + this._width / 2,
      y: this._position.y + this._height / 2
    });
  }

  centerOn = (position: Vector2) => {
    this._position = position.subtract({
      x: this._width / 2,
      y: this._height / 2
    });
  };

  update = () => {
    if (this._target) {
      this.centerOn(this.center.lerp(new Vector2(this._target.center), 0.09));
    }

    this._stage.position = new PIXI.Point(
      Math.floor(-this._position.x), 
      Math.floor(-this._position.y)
    );
  };
}
