import { Vector2 } from "./vector2";
import { Graphics, Sprite, Container, Point } from "pixi.js";
import { Line } from "./line";
import { Game } from "../game";
import { Entity } from "./entity";
import { GameState } from "../state";
import { Rect } from "./rect";

const MAX_LEN = 500;

export class Debug {
  public static DebugMode = false;

  public static DebugGraphicStack: Graphics[] = [];

  public static Clear(): void {
    for (const debug of Debug.DebugGraphicStack) {
      debug.parent.removeChild(debug);
      debug.destroy();
    }

    Debug.DebugGraphicStack = [];
  }

  /**
   * Draw a point on the game.
   */
  public static DrawPoint(point: Vector2, color = 0xff0000) {
    const graphics = new Graphics();

    new Line({
      x1: point.x - 10,
      x2: point.x + 10,

      y1: point.y - 10,
      y2: point.y + 10,
    }).drawOnto(graphics, color);

    new Line({
      x1: point.x + 10,
      x2: point.x - 10,

      y1: point.y - 10,
      y2: point.y + 10,
    }).drawOnto(graphics, color);

    Game.Instance.stage.addChild(graphics);

    this.DebugGraphicStack.push(graphics);

    if (this.DebugGraphicStack.length > MAX_LEN) {
      const toBeRemoved = this.DebugGraphicStack.shift()!;

      toBeRemoved.parent.removeChild(toBeRemoved);
      toBeRemoved.destroy();
    }
  }

  public static DrawLineV2(one: Vector2, two: Vector2, color = 0xff0000) {
    Debug.DrawLine(new Line({ one, two }), color);
  }

  public static DrawLine(line: Line, color = 0xff0000) {
    const graphics = new Graphics();

    line.drawOnto(graphics, color);

    Game.Instance.stage.addChild(graphics);

    this.DebugGraphicStack.push(graphics);

    if (this.DebugGraphicStack.length > MAX_LEN) {
      const toBeRemoved = this.DebugGraphicStack.shift()!;

      toBeRemoved.parent.removeChild(toBeRemoved);
      toBeRemoved.destroy();
    }
  }

  public static DrawRect(rect: Rect) {
    for (const line of rect.getLinesFromRect()) {
      Debug.DrawLine(line);
    }
  }

  public static DrawBounds(entity: Entity | Sprite | Graphics, state: GameState) {
    if (entity instanceof Entity) {
      const group = entity.collisionBounds(state);

      for (const rect of group.getRects()) {
        Debug.DrawRect(rect);
      }
    } else {
      Debug.DrawRect(new Rect({
        x: entity.x,
        y: entity.y,
        w: entity.width,
        h: entity.height,
      }));
    }
  }

  private static profiles: { [key: string]: number[] } = {};

  public static Profile(name: string, cb: () => void): void {
    Debug.profiles[name] = Debug.profiles[name] || [];

    const start = window.performance.now();

    cb(); 

    const end = window.performance.now();

    Debug.profiles[name].push(end - start);

    if (Debug.profiles[name].length === 60) {
      const average = Debug.profiles[name].reduce((a, b) => a + b) / 60;
      const rounded = Math.floor(average * 100) / 100;

      Debug.profiles[name] = [];

      console.log(`${ name }: ${ rounded }ms`)
    }
  }

  static ClearDrawCount() {
    (Sprite as any).drawCount = 0;
    (Container as any).drawCount = 0;
  }

  static GetDrawCount() {
    return (
      (Sprite as any).drawCount + 
      (Container as any).drawCount
    );
  }

  public static DebugStuff(state: GameState) {
    if (state.keys.justDown.Z) {
      Debug.DebugMode = true;

      state.stage.x = 0;
      state.stage.y = 0;

      if (state.stage.scale.x === 0.2) {
        state.stage.scale = new Point(1, 1);
      } else {
        state.stage.scale = new Point(0.2, 0.2);
      }
    }

    if (Debug.DebugMode) {
      if (state.keys.down.W) {
        state.stage.y += 20;
      }
      if (state.keys.down.S) {
        state.stage.y -= 20;
      }
      if (state.keys.down.D) {
        state.stage.x -= 20;
      }
      if (state.keys.down.A) {
        state.stage.x += 20;
      }
    }
  }
}

(Sprite as any).drawCount = 0;

(Sprite.prototype as any).__render = (Sprite.prototype as any)._render;
(Sprite.prototype as any)._render = function (renderer: any) {
  (Sprite as any).drawCount++;
  this.__render(renderer);
};


(Sprite.prototype as any).__renderCanvas = (Sprite.prototype as any)._renderCanvas;
(Sprite.prototype as any)._renderCanvas = function (renderer: any) {
  (Sprite as any).drawCount++;
  this.__renderCanvas(renderer);
};


// PIXI.Container

(Container as any).drawCount = 0;

(Container.prototype as any).__render = (Container.prototype as any)._render;
(Container.prototype as any)._render = function (renderer: any) {
  (Container as any).drawCount++;
  this.__render(renderer);
};


(Container.prototype as any).__renderCanvas = (Container.prototype as any)._renderCanvas;
(Container.prototype as any)._renderCanvas = function (renderer: any) {
  (Container as any).drawCount++;
  this.__renderCanvas(renderer);
};