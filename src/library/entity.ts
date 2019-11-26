import { Game } from "../game";
import { Vector2 } from "./vector2";
import { Rect } from "./rect";
import { Sprite, Texture, Container }from "pixi.js";
import { GameState, GameMode } from "../state";
import { GetUniqueID } from "./util";

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
  name       = "i should really give this entity a name!";
  id         = GetUniqueID();
  entityType = EntityType.NormalEntity;
  sprite     : Sprite;
  transparent: boolean;

  protected _collideable: boolean;
  protected _interactable: boolean;
  protected _isLight: boolean;

  constructor(props: {
    collidable   : boolean;
    texture     ?: Texture;
    transparent ?: boolean;
    interactable?: boolean;
    light       ?: boolean;
  }) {
    super();

    this.sprite        = new Sprite(props.texture);
    this._collideable  = props.collidable;
    this._interactable = props.interactable || false;
    this._isLight        = props.light || false;

    this.startUpdating();

    this.sprite.anchor.set(0);
    this.addChild(this.sprite);

    this.transparent = props.transparent || false;
  }

  startUpdating() {
    Game.Instance.gameState.entities.put(this);
  }

  stopUpdating() {
    Game.Instance.gameState.entities.remove(this);
  }

  abstract activeModes: GameMode[];
  abstract update: (state: GameState) => void;
  abstract collide: (other: Entity, intersection: Rect) => void;

  setCollideable(isCollideable: boolean) {
    this._collideable = isCollideable;
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

  positionVector() {
    return new Vector2({
      x: this.x,
      y: this.y,
    });
  }

  // Use this instead of destroy
  // TODO wrap container so we can do this correctly
  betterDestroy(state: GameState) {
    state.toBeDestroyed.push(this);
  }

  hash(): string {
    return `[Entity ${ this.id }]`;
  }

  isCollideable(): boolean {
    return this._collideable;
  }

  isInteractable(): boolean {
    return this._interactable;
  }

  isLight(): boolean {
    return this._isLight;
  }
}
