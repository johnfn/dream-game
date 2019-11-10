import { Entity } from "./library/entity";
import { Game } from "./game";
import { Texture, filters } from "pixi.js";
import { Rect } from "./library/rect";
import { C } from "./constants";
import { Vector2 } from "./library/vector2";
import { GameState, DreamState } from "./state";
import { InteractableEntity } from "./library/interactable_entity";

// TODO: Allow shard color customization in constructor
export class DreamShard extends InteractableEntity {
  constructor(props: { game: Game }) {
    super({
      game: props.game,
      texture: C.Loader.getResource("art/temp.png").texture,
      collidable: false,
      dynamic: false
    });
    props.game.entities.interactable.push(this);
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
      C.Stage.filters = [C.NoiseFilter];
    } else if (gameState.dreamState === DreamState.dream) {
      gameState.dreamState = DreamState.normal;
      C.Stage.filters = [];
    }
  };

  update = () => {
    // TODO: Maybe animate a float cycle
    return;
  };
}
