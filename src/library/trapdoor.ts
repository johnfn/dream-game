import { Entity } from "./entity";
import { GameMode, GameState } from "../state";
import { Rect } from "./rect";
import { InteractableEntity } from "./interactable_entity";
import { C } from "../constants";

type StairType = "up" | "down";
export class Trapdoor extends InteractableEntity {
  private stairType: StairType;

  constructor(props: { stairType: StairType }) {
    super({
      collidable: true,
      dynamic   : false
    });

    this.stairType = props.stairType;
  }

  activeModes = [GameMode.Normal];

  update = () => {
    // Nothing
  };
  collide = (other: Entity, intersection: Rect) => {
    //Do nothing
  };

  interact = (other: Entity, gameState: GameState) => {
    // Change level
    if (this.stairType === "down") {
      gameState.map.updateLevel(gameState.level - 1, gameState);
    } else if (this.stairType === "up") {
      gameState.map.updateLevel(gameState.level + 1, gameState);
    }
  };

  interactRange = C.INTERACTION_DISTANCE;
  interactText  = "";
  canInteract   = () => true;
}
