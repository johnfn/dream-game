import * as PIXI from "pixi.js";

import { Entity } from "./library/entity";
import { Game } from "./game";
import { Vector2 } from "./library/vector2";
import { Rect } from "./library/rect";
import { GameState, GameMode } from "./state";
import { KeyboardState } from "./library/keyboard";
import { MovingEntity } from "./library/moving_entity";
import { C } from "./constants";
import { Spritesheet, BaseTexture } from "pixi.js";

export class Character extends MovingEntity {
  static Speed = 5;

  activeModes = [GameMode.Normal];
  name = "Character";

  private _animFrame = 0; //0 to 60
  private _totalNumFrames = 8;
  protected _maxSpeed = 300;
  private _textures: { [key: string]: PIXI.Texture } = {};

  private _spriteSheet: Spritesheet;
  private _lastNonzeroVelocity: Vector2 = Vector2.Zero; //Used to determine idle sprite's looking direction

  constructor(props: { game: Game }) {
    super({
      game: props.game,
      texture: C.Loader.getResource("art/temp.png").texture,
      collidable: true
    });

    const cellDim = new Vector2({ x: 64, y: 110 });
    const sheetDim = new Vector2({ x: 512, y: 1320 });
    const numRows = sheetDim.y / cellDim.y;
    const numCols = sheetDim.x / cellDim.x;
    const frames: { [key: string]: {} } = {};
    const frameNames: { [key: number]: string } = {
      0: "char_idle_d",
      1: "char_idle_u",
      2: "char_idle_l",
      3: "char_idle_r",
      4: "char_walk_d",
      5: "char_walk_u",
      6: "char_walk_l",
      7: "char_walk_r",
      8: "char_walk_rd",
      9: "char_walk_ld",
      10: "char_walk_ru",
      11: "char_walk_lu"
    };
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const idx = x + y * numCols;
        const frameData = {
          frame: {
            x: x * cellDim.x,
            y: y * cellDim.y,
            w: cellDim.x,
            h: cellDim.y
          },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: cellDim.x, h: cellDim.y },
          sourceSize: { w: cellDim.x, h: cellDim.y }
        };
        const frameName = frameNames[Math.floor(idx / 8)] + "-" + x + ".png";
        frames[frameName] = frameData;
      }
    }
    const data = {
      frames: frames,
      animations: {},
      meta: {
        app: "gabby",
        version: "1.0",
        image: "char_spritesheet.png",
        format: "RGBA8888",
        size: { w: sheetDim.x, h: sheetDim.y },
        scale: "1"
      }
    };
    const spriteSheet = new Spritesheet(
      C.Loader.getResource("art/char_spritesheet.png").texture.baseTexture,
      data
    );
    spriteSheet.parse(() => {});
    this._spriteSheet = spriteSheet;
    this._textures = spriteSheet.textures;
    this.sprite.texture = this._textures["char_idle_d-0.png"];
    this.zIndex = C.Depths.Player;
  }

  // Assumes 60 FPS
  getFrameNumber(props: {
    currFrame: number;
    numAnimFrames: number;
    animSpeed: number;
  }) {
    return (
      Math.floor(
        props.numAnimFrames * ((props.animSpeed * props.currFrame) / 60)
      ) % props.numAnimFrames
    );
  }

  updateSprite = (): void => {
    const frameNumber = this.getFrameNumber({
      currFrame: this._animFrame,
      numAnimFrames: this._totalNumFrames,
      animSpeed: 1.5
    });

    if (this.velocity.equals(Vector2.Zero)) {
      if (this._lastNonzeroVelocity.x > 0) {
        this.sprite.texture = this._textures[`char_idle_r-${frameNumber}.png`];
      } else if (this._lastNonzeroVelocity.x < 0) {
        this.sprite.texture = this._textures[`char_idle_l-${frameNumber}.png`];
      } else if (this._lastNonzeroVelocity.y < 0) {
        this.sprite.texture = this._textures[`char_idle_u-${frameNumber}.png`];
      } else if (this._lastNonzeroVelocity.y > 0) {
        this.sprite.texture = this._textures[`char_idle_d-${frameNumber}.png`];
      }
    } else {
      if (this.velocity.x > 0) {
        if (this.velocity.y > 0) {
          this.sprite.texture = this._textures[
            `char_walk_rd-${frameNumber}.png`
          ];
        } else if (this.velocity.y < 0) {
          this.sprite.texture = this._textures[
            `char_walk_ru-${frameNumber}.png`
          ];
        } else {
          this.sprite.texture = this._textures[
            `char_walk_r-${frameNumber}.png`
          ];
        }
      } else if (this.velocity.x < 0) {
        if (this.velocity.y > 0) {
          this.sprite.texture = this._textures[
            `char_walk_ld-${frameNumber}.png`
          ];
        } else if (this.velocity.y < 0) {
          this.sprite.texture = this._textures[
            `char_walk_lu-${frameNumber}.png`
          ];
        } else {
          this.sprite.texture = this._textures[
            `char_walk_l-${frameNumber}.png`
          ];
        }
      } else if (this.velocity.y < 0) {
        this.sprite.texture = this._textures[`char_walk_u-${frameNumber}.png`];
      } else if (this.velocity.y > 0) {
        this.sprite.texture = this._textures[`char_walk_d-${frameNumber}.png`];
      }
    }
  };

  update = (gameState: GameState) => {
    this.velocity = this.getVelocity(gameState.keys);
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      this._lastNonzeroVelocity = this.velocity;
    }

    if (gameState.keys.justDown.Spacebar) {
      gameState.inDreamWorld = !gameState.inDreamWorld;

      gameState.dreamMapLayer.visible = gameState.inDreamWorld;
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

    return velocity
      .normalize()
      .multiply(keys.down.L && C.DEBUG ? 20 : Character.Speed);
  };
}
