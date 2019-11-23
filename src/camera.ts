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

  private halfDimensions(): Vector2 {
    return new Vector2({
      x: this._width / 2,
      y: this._height / 2
    });
  }

  centerOn = (position: Vector2) => {
    this._position = position.subtract(this.halfDimensions());
  };

  calculateDesiredPosition = (state: GameState): Vector2 => {
    let desiredPosition = Vector2.Zero;

    if (this._target) {
      desiredPosition = this._target.center.subtract(this.halfDimensions());
    }

    const mapBounds    = state.map.getCameraBounds();
    const currentBound = mapBounds.find(bound => bound.contains(this._target.positionVector()));

    if (!currentBound) {
      console.error("no bound for camera!");

      return desiredPosition;
    }

    if (currentBound.w < C.CANVAS_WIDTH || currentBound.h < C.CANVAS_HEIGHT) {
      throw new Error("There is a bound on the map which is too small for the camera.");
    }

    // fit the camera rect into the bounds rect

    if (desiredPosition.x < currentBound.left) {
      desiredPosition = desiredPosition.withX(currentBound.left);
    }

    if (desiredPosition.x + this.bounds().w > currentBound.right) {
      desiredPosition = desiredPosition.withX(currentBound.right - this._width);
    }

    if (desiredPosition.y < currentBound.top) {
      desiredPosition = desiredPosition.withY(currentBound.top);
    }

    if (desiredPosition.y + this.bounds().h > currentBound.bottom) {
      desiredPosition = desiredPosition.withY(currentBound.bottom - this._height);
    }

    return desiredPosition;
  };

  update = (state: GameState) => {
    const desiredPosition = this.calculateDesiredPosition(state);

    this._position = this._position.lerp(desiredPosition, FollowCamera.LERP_SPEED);

    this._stage.position = new PIXI.Point(
      Math.floor(-this._position.x), 
      Math.floor(-this._position.y)
    );
  };
}
