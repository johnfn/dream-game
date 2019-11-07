import * as PIXI from "pixi.js";
import { Entity } from "./entity";
import { Game } from "./game";
import { Point } from "./library/point";

export class Character extends Entity {
  constructor(props: { game: Game; texture: PIXI.Texture }) {
    super({
      game: props.game,
      texture: props.texture,
      collidable: true,
      dynamic: true
    });
  }

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
    direction.normalize();
    this.direction = direction;
  };
}
