import * as PIXI from "pixi.js";
import { Entity } from "./library/entity";
import { Game } from "./game";
import { Vector2 } from "./library/vector2";
import { Rect } from "./library/rect";
import { GameState, GameMode } from "./state";
import { KeyboardState } from "./library/keyboard";
import { MovingEntity } from "./library/moving_entity";

export class Character extends MovingEntity {
  activeModes = [GameMode.Normal];

  private _animFrame = 0; //0 to 60
  private _totalNumFrames = 8; 
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

  // Assumes 60 FPS
  getFrameNumber(currFrame: number, numAnimFrames: number, animSpeed: number ) {
    return Math.floor(numAnimFrames * (animSpeed * currFrame / 60)) % numAnimFrames;
  }

  updateSprite = (): void => {
    const frameNumber = this.getFrameNumber(this._animFrame, this._totalNumFrames, 2);

    if (this.velocity.equals(Vector2.Zero)) {
      this.sprite.texture = this._textures[`char_idle-${frameNumber}.png`];
    } else if (this.velocity.x > 0) {
      this.sprite.texture = this._textures[`char_walk_right-${frameNumber}.png`];
    } else if (this.velocity.x < 0) {
      this.sprite.texture = this._textures[`char_walk_left-${frameNumber}.png`];
    } else if (this.velocity.y < 0) {
      this.sprite.texture = this._textures[`char_walk_up-${frameNumber}.png`];
    } else if (this.velocity.y > 0) {
      this.sprite.texture = this._textures[`char_walk_down-${frameNumber}.png`];
    }
  };

  update = (gameState: GameState) => {
    this.velocity = this.getVelocity(gameState.keys);

    if (gameState.keys.justDown.Spacebar) {
      gameState.inDreamWorld = !gameState.inDreamWorld;

      gameState.dreamMapLayer.visible   = gameState.inDreamWorld;
      gameState.realityMapLayer.visible = !gameState.inDreamWorld;
    }

    this._animFrame += 1;
    this._animFrame %= 60;

    this.updateSprite();

    window.localStorage.setItem("characterx", String(this.x));
    window.localStorage.setItem("charactery", String(this.y));
  };

  collide = (other: Entity, intersection: Rect) => {
    return;
  };

  interact = (other: Entity) => {
    return;
  };

  getVelocity = (keys: KeyboardState): Vector2 => {
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

    return velocity.normalize().multiply(5);
  };
}
