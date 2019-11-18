import { Game } from "../game";
import { Vector2 } from "./vector2";
import { Rect } from "./rect";
import { Sprite, Texture, Container }from "pixi.js";
import { C } from "../constants";
import { GameState, GameMode } from "../state";

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
export abstract class Entity extends Container {
  // just for debugging
  name = "i should really give this entity a name!";

  entityType = EntityType.NormalEntity;
  sprite: Sprite;

  constructor(props: {
    texture   ?: Texture;
    collidable : boolean;
    dynamic    : boolean;
  }) {
    super();

    this.sprite = new Sprite(props.texture);
    Game.Instance.entities.all.push(this);

    if (props.collidable) {
      Game.Instance.entities.collidable.push(this);
    } else {
      Game.Instance.entities.static.push(this);
    }

    this.sprite.anchor.set(0);
    this.addChild(this.sprite);
  }

  abstract activeModes: GameMode[];
  abstract update: (state: GameState) => void;
  abstract collide: (other: Entity, intersection: Rect) => void;

  setCollideable(newValue: boolean) {
    if (newValue) {
      Game.Instance.entities.static.splice(Game.Instance.entities.static.indexOf(this), 1);
      Game.Instance.entities.collidable.push(this);
    } else {
      Game.Instance.entities.collidable.splice(Game.Instance.entities.collidable.indexOf(this), 1);
      Game.Instance.entities.static.push(this);
    }
  }

  setTexture(newTexture: Texture) {
    this.sprite.texture = newTexture;
  }

  // TODO: rename once this isnt a name collision with superclass
  public myGetBounds(): Rect {
    return new Rect({
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    });
  }

  public get bounds(): Rect {
    return new Rect({
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
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
