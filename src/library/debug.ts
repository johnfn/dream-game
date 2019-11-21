import { Vector2 } from "./vector2";
import { Graphics } from "pixi.js";
import { Line } from "./line";
import { Game } from "../game";

const MAX_LEN = 500;

export class Debug {
  public static DebugGraphicStack: Graphics[] = [];

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
}