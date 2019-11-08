import * as PIXI from "pixi.js";
import { Entity } from "./entity";
import { Game } from "./game";
import { Point } from "./library/point";
import { Rect } from "./library/rect";

export class Character extends Entity {
  private _direction: Point = Point.Zero; //Normalized direction vector
  private _animFrame: number = 0; //0 to 60
  private _frameRate: number = 8; //Animation frames changes per second
  private _maxSpeed: number = 100;
  private _textures: { [key: string]: PIXI.Texture } = {};
  constructor(props: { game: Game; spritesheet: PIXI.Spritesheet }) {
    super({
      game: props.game,
      texture: props.spritesheet.textures[`char_idle-0.png`],
      collidable: true,
      dynamic: true
    });
    this._textures = props.spritesheet.textures;
  }

  updateSprite = (): void => {
    const frameNumber = Math.floor(this._animFrame / (60 / this._frameRate));
    if (this.direction === Point.Zero) {
      this.texture = this._textures[`char_idle-${frameNumber}.png`];
    } else if (this.direction.x > 0) {
      this.texture = this._textures[`char_walk_right-${frameNumber}.png`];
    } else if (this.direction.x < 0) {
      this.texture = this._textures[`char_walk_left-${frameNumber}.png`];
    } else if (this.direction.y < 0) {
      this.texture = this._textures[`char_walk_up-${frameNumber}.png`];
    } else if (this.direction.y > 0) {
      this.texture = this._textures[`char_walk_down-${frameNumber}.png`];
    }
  };

  update = () => {
    this._animFrame += 1;
    this._animFrame %= 60;
    this.position.x += (this._maxSpeed * this.direction.x) / 60;
    this.position.y += (this._maxSpeed * this.direction.y) / 60;
    this.updateSprite();
  };

  public get direction(): Point {
    return this._direction;
  }

  collide = (other: Entity, intersection: Rect) => {
    return;
  };

  interact = (other: Entity) => {
    return;
  };

  handleInput = (keys: { [index: string]: boolean }) => {
    let direction = Point.Zero;
    if (keys["w"]) {
      direction = new Point({ x: direction.x, y: -1 });
    }
    if (keys["a"]) {
      direction = new Point({ x: -1, y: direction.y });
    }
    if (keys["s"]) {
      direction = new Point({ x: direction.x, y: 1 });
    }
    if (keys["d"]) {
      direction = new Point({ x: 1, y: direction.y });
    }
    this._direction = direction.normalize();
  };
}
