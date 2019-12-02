import { Game } from "../game";
import { Vector2 } from "./vector2";
import { Rect } from "./rect";
import { Sprite, Texture, Graphics }from "pixi.js";
import { GameState, GameMode } from "../state";
import { GetUniqueID } from "./util";
import { RectGroup } from "./rect_group";

export enum EntityType {
  NormalEntity,

  /** 
   * The collision information for this entity will be calculated by the main
   * game loop.
   */
  MovingEntity,
}

class AugmentedSprite extends Sprite {
  id = GetUniqueID();

  constructor(texture: Texture | undefined) {
    super(texture);
  }
}

// TODO: we might want to wrap the Sprite methods (rather than inheriting from
// it directly) so that we dont have to deal with some PIXI stuff (mainly their
// own Point and Rect classes which aren't as good as ours)

// TODO: probably make less of these methods abstract?
export abstract class Entity {
  // just for debugging
  name       = "i should really give this entity a name!";
  id         = GetUniqueID();
  entityType = EntityType.NormalEntity;
  sprite     : AugmentedSprite;
  transparent: boolean;

  static SpriteToEntity: { [key: number]: Entity } = {};

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
    this.sprite           = new AugmentedSprite(props.texture);
    Entity.SpriteToEntity[this.sprite.id] = this;

    this._collideable     = props.collidable;
    this._interactable    = props.interactable || false;
    this._isLight         = props.light || false;

    this.startUpdating();

    this.sprite.sortableChildren = true;
    this.sprite.anchor.set(0);

    this.transparent = props.transparent || false;
  }

  addChild(child: Entity) {
    this.sprite.addChild(child.sprite);
  }

  removeChild(child: Entity) {
    this.sprite.removeChild(child.sprite);
  }

  startUpdating() {
    Game.Instance.state.entities.put(this);
  }

  stopUpdating() {
    Game.Instance.state.entities.remove(this);
  }

  abstract activeModes: GameMode[];
  abstract update(state: GameState): void;
  abstract collide: (other: Entity, intersection: Rect) => void;

  setCollideable(isCollideable: boolean) {
    this._collideable = isCollideable;
  }

  setTexture(newTexture: Texture) {
    this.sprite.texture = newTexture;
  }

  public collisionBounds(state: GameState): RectGroup {
    return new RectGroup([
      new Rect({
        x: this.x,
        y: this.y,
        w: this.width,
        h: this.height
      })
    ]);
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

  children(): Entity[] {
    const children = this.sprite.children;
    const result: Entity[] = [];

    for (const child of children) {
      if (child instanceof AugmentedSprite) {
        result.push(Entity.SpriteToEntity[child.id]);
      }
    }

    return result;
  }

  // Use this instead of destroy
  // TODO wrap container so we can do this correctly
  betterDestroy(state: GameState) {
    state.toBeDestroyed.push(this);
  }

  hash(): string {
    return `[Entity ${ this.id }]`;
  }

  // TODO: Better way to do this
  isCollideable(): boolean {
    return this._collideable;
  }

  isInteractable(): boolean {
    return this._interactable;
  }

  isLight(): boolean {
    return this._isLight;
  }

  // Sprite wrapper stuff

  public get x(): number { return this.sprite.x; }
  public set x(value: number) { this.sprite.x = value; }

  public get y(): number { return this.sprite.y; }
  public set y(value: number) { this.sprite.y = value; }

  public get width(): number { return this.sprite.width; }
  public set width(value: number) { this.sprite.width = value; }

  public get height(): number { return this.sprite.height; }
  public set height(value: number) { this.sprite.height = value; }

  public get alpha(): number { return this.sprite.alpha; }
  public set alpha(value: number) { this.sprite.alpha = value; }

  public get position(): Vector2 { return new Vector2({ x: this.x, y: this.y }); }

  public get zIndex(): number { return this.sprite.zIndex; }
  public set zIndex(value: number) { this.sprite.zIndex = value; }

  public get visible(): boolean { return this.sprite.visible; }
  public set visible(value: boolean) { this.sprite.visible = value; }

  public set texture(value: Texture) { this.sprite.texture = value; }

  public set mask(value: Sprite | Graphics | null) { this.sprite.mask = value; }
  public get mask(): Sprite | Graphics | null { return this.sprite.mask; }

  public get scale(): Vector2 { return new Vector2({ x: this.sprite.scale.x, y: this.sprite.scale.y }); }
  public set scale(value: Vector2) { 
    this.sprite.scale.x = value.x;
    this.sprite.scale.y = value.y;
  }
}
