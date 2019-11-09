import { Game } from "../game";
import { Vector2 } from "./vector2";
import { Rect } from "./rect";
import { Sprite, Texture }from "pixi.js";
import { C } from "../constants";
import { GameState } from "../state";

export enum EntityType {
  NormalEntity,

  /** 
   * The collision information for this entity will be calculated by the main
   * game loop.
   */
  MovingEntity,
}

// TODO: we might want to wrap the Sprite methods (rather than inheriting from
// it directly) so that we dont have to deal with some PIXI stuff (mainly their
// own Point and Rect classes which aren't as good as ours)

// TODO: probably make less of these methods abstract?
export abstract class Entity extends Sprite {
  entityType = EntityType.NormalEntity;

  constructor(props: {
    game      : Game;
    texture   : Texture;
    collidable: boolean;
    dynamic   : boolean;
  }) {
    super(props.texture);

    if (props.collidable) {
      props.game.entities.collidable.push(this);
    } else {
      props.game.entities.static.push(this);
    }
  }

  abstract update: (state: GameState) => void;
  abstract collide: (other: Entity, intersection: Rect) => void;
  abstract interact: (other: Entity) => void;

  public get bounds(): Rect {
    const b = this.getBounds();

    return new Rect({
      x: b.x,
      y: b.y,
      w: b.width,
      h: b.height
    });
  }

  public get center(): Vector2 {
    return new Vector2(this.position).add({
      x: this.width / 2,
      y: this.height / 2
    });
  }

  // TODO: Check entire bounds
  // TODO: Check against camera too
  isOnScreen = () => {
    // Checks the center

    return (
      this.position.x > 0 &&
      this.position.x < C.CANVAS_WIDTH &&
      this.position.y > 0 &&
      this.position.y < C.CANVAS_HEIGHT
    );
  };
}
