import { Entity } from "./library/entity";
import { Game } from "./game";
import { Point } from "pixi.js";
import { Rect } from "./library/rect";
import { C } from "./constants";
import { Vector2 } from "./library/vector2";
import { GameState, DreamState } from "./state";
import { InteractableEntity } from "./library/interactable_entity";

// TODO: Allow shard color customization in constructor
export class DreamShard extends InteractableEntity {
  private _animFrame: number = 0;
  private _endPos: Vector2;
  private _startPos: Vector2;
  constructor(props: { game: Game }) {
    super({
      game: props.game,
      texture: C.Loader.getResource("art/temp.png").texture,
      collidable: false,
      dynamic: false
    });
    this._startPos = new Vector2(this.position);
    this._endPos = this._startPos.add({x: 0, y: 10});
  }

  // Nothing should be able to collide with a dream shard,
  // as they're not physical objects
  collide = (other: Entity, intersection: Rect) => {
    return;
  };

  checkForInteractions = (other: Entity, gameState: GameState) => {
    if (
      new Vector2(other.position).diagonalDistance(new Vector2(this.position)) <
      100
    ) {
      if (gameState.keys.justDown.E) {
        return true;
      }
    }
    return false;
  };

  interact = (other: Entity, gameState: GameState) => {
    if (this.checkForInteractions(other, gameState)) {
      this.toggleDream(gameState);
    }
  };

  toggleDream = (gameState: GameState) => {
    if (gameState.dreamState === DreamState.normal) {
      gameState.dreamState = DreamState.dream;
      C.Stage.filters = C.DreamFilters;
    } else if (gameState.dreamState === DreamState.dream) {
      gameState.dreamState = DreamState.normal;
      C.Stage.filters = [];
    }
  };

  update = () => {
    this._animFrame += 1;
    this._animFrame %= 200;
    const nextPos = new Vector2(this._startPos).coserp(this._endPos, this._animFrame/200);
    this.sprite.position = new Point(nextPos.x, nextPos.y);
    this.sprite.rotation = Math.PI*this._animFrame/200
    return;
  };
}
