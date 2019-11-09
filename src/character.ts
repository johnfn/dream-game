import * as PIXI from "pixi.js";
import { Entity } from "./entity";
import { Game } from "./game";
import { Point } from "./library/point";
import { Rect } from "./library/rect";
import { GameState } from "./state";
import { KeyboardState } from "./library/keyboard";

export class Character extends Entity {
  private _direction = Point.Zero; //Normalized direction vector
  private _animFrame = 0; //0 to 60
  private _frameRate = 8; //Animation frames changes per second
  private _maxSpeed = 300;
  private _textures: { [key: string]: PIXI.Texture } = {};

  constructor(props: { game: Game; spritesheet: PIXI.Spritesheet }) {
    super({
      game      : props.game,
      texture   : props.spritesheet.textures[`char_idle-0.png`],
      collidable: true,
      dynamic   : true
    });

    this._textures = props.spritesheet.textures;
  }

  updateSprite = (): void => {
    const frameNumber = Math.floor(this._animFrame / (60 / this._frameRate));

    if (this.direction.equals(Point.Zero)) {
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

  update = (gameState: GameState) => {
    this.handleInput(gameState.keys);

    this._animFrame += 1;
    this._animFrame %= 60;

    this.position.x += (this._maxSpeed * this.direction.x) / 60;
    this.position.y += (this._maxSpeed * this.direction.y) / 60;

    const tile = gameState.map.getTileAt(this.position.x, this.position.y);

    if (tile !== null) {
      console.log(tile);

      if (tile.isCollider) {
        this.position.x -= (this._maxSpeed * this.direction.x) / 60;
        this.position.y -= (this._maxSpeed * this.direction.y) / 60;
      }
    }

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

  handleInput = (keys: KeyboardState) => {
    let direction = Point.Zero;

    if (keys.down.W) {
      direction = new Point({ x: direction.x, y: -1 });
    }

    if (keys.down.A) {
      direction = new Point({ x: -1, y: direction.y });
    }

    if (keys.down.S) {
      direction = new Point({ x: direction.x, y: 1 });
    }

    if (keys.down.D) {
      direction = new Point({ x: 1, y: direction.y });
    }

    this._direction = direction.normalize();
  };
}
