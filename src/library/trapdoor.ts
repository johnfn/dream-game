import { Entity } from "./entity";
import { GameMode, GameState } from "../state";
import { Texture } from "pixi.js";
import { TiledTilemap } from "./tilemap";
import { Rect } from "./rect";
import { InteractableEntity } from "./interactable_entity";
import { C } from "../constants";

type StairType = "up" | "down";
export class Trapdoor extends InteractableEntity {
    private stairType: StairType;   constructor(props: {
    texture: Texture;
    stairType: StairType;
  }) {
    super({
      texture: props.texture,
      collidable: true,
      dynamic: false,
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

  interact= (other: Entity, gameState: GameState) => {
    // Change level
    if (this.stairType === "down") {
        gameState.level -= 1;
    } else if (this.stairType === "up") {
        gameState.level += 1;
    }
  }

  interactRange = C.INTERACTION_DISTANCE;
  interactText = "";

}
