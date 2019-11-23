import { Vector2 } from "./library/vector2";
import { Entity } from "./library/entity";
import * as PIXI from "pixi.js";
import { Rect } from "./library/rect";
import { GameState } from "./state";
import { C } from "./constants";
import { Debug } from "./library/debug";

export class FollowCamera {
  private static LERP_SPEED = 0.09;

  /**
   * Top left coordinate of the camera.
   */
  private _position: Vector2 = Vector2.Zero;
  private _target  : Entity;
  private _stage   : PIXI.Container;
  private _width   : number;
  private _height  : number;

  constructor(props: { stage: PIXI.Container; followTarget: Entity, width: number; height: number }) {
    this._stage  = props.stage;
    this._width  = props.width;
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

  public bounds(): Rect {
    return new Rect({
      x: this.center.x - this._width / 2,
      y: this.center.y - this._height / 2,
      w: this._width,
      h: this._height,
    });
  }

  centerOn = (position: Vector2) => {
    this._position = position.subtract({
      x: this._width / 2,
      y: this._height / 2
    });
  };

  keepWithinBounds = (state: GameState) => {
    const mapBounds    = state.map.getCameraBounds();
    const currentBound = mapBounds.find(bound => bound.contains(this._target.positionVector()));

    if (!currentBound) {
      console.error("no bound for camera!");

      return;
    }

    if (currentBound.w < C.CANVAS_WIDTH || currentBound.h < C.CANVAS_HEIGHT) {
      throw new Error("There is a bound on the map which is too small for the camera.");
    }

    // fit the camera rect into the bounds rect

    if (this.bounds().left < currentBound.left) {
      this._position = this._position.withX(currentBound.left);
    }

    if (this.bounds().right > currentBound.right) {
      this._position = this._position.withX(currentBound.right - this._width);
    }

    if (this.bounds().top < currentBound.top) {
      this._position = this._position.withY(currentBound.top);
    }

    if (this.bounds().bottom > currentBound.bottom) {
      this._position = this._position.withY(currentBound.bottom - this._height);
    }
  };

  update = (state: GameState) => {
    if (this._target) {
      this.centerOn(this.center.lerp(new Vector2(this._target.center), FollowCamera.LERP_SPEED));
    }

    this.keepWithinBounds(state);

    this._stage.position = new PIXI.Point(
      Math.floor(-this._position.x), 
      Math.floor(-this._position.y)
    );
  };
}
