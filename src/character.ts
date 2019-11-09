import * as PIXI from "pixi.js";
import { Entity } from "./library/entity";
import { Game } from "./game";
import { Vector2 } from "./library/point";
import { Rect } from "./library/rect";
import { GameState } from "./state";
import { KeyboardState } from "./library/keyboard";
import { MovingEntity } from "./library/moving_entity";

export class Character extends MovingEntity {
  private _animFrame = 0; //0 to 60
  private _frameRate = 8; //Animation frames changes per second
  protected _maxSpeed = 300;
  private _textures: { [key: string]: PIXI.Texture } = {};

  constructor(props: { game: Game; spritesheet: PIXI.Spritesheet }) {
    super({
      game      : props.game,
      texture   : props.spritesheet.textures[`char_idle-0.png`],
      collidable: true,
    });

    this._textures = props.spritesheet.textures;
  }

  updateSprite = (): void => {
    const frameNumber = Math.floor(this._animFrame / (60 / this._frameRate));

    if (this.velocity.equals(Vector2.Zero)) {
      this.texture = this._textures[`char_idle-${frameNumber}.png`];
    } else if (this.velocity.x > 0) {
      this.texture = this._textures[`char_walk_right-${frameNumber}.png`];
    } else if (this.velocity.x < 0) {
      this.texture = this._textures[`char_walk_left-${frameNumber}.png`];
    } else if (this.velocity.y < 0) {
      this.texture = this._textures[`char_walk_up-${frameNumber}.png`];
    } else if (this.velocity.y > 0) {
      this.texture = this._textures[`char_walk_down-${frameNumber}.png`];
    }
  };

  update = (gameState: GameState) => {
    this.handleInput(gameState.keys);

    this._animFrame += 1;
    this._animFrame %= 60;

    this.updateSprite();
  };

  collide = (other: Entity, intersection: Rect) => {
    return;
  };

  interact = (other: Entity) => {
    return;
  };

  handleInput = (keys: KeyboardState) => {
    let velocity = Vector2.Zero;

    if (keys.down.W) {
      velocity = new Vector2({ x: velocity.x, y: -1 });
    }

    if (keys.down.A) {
      velocity = new Vector2({ x: -1, y: velocity.y });
    }

    if (keys.down.S) {
      velocity = new Vector2({ x: velocity.x, y: 1 });
    }

    if (keys.down.D) {
      velocity = new Vector2({ x: 1, y: velocity.y });
    }

    this.velocity = velocity.normalize().multiply(5);
  };
}
