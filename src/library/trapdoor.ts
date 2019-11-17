import { Entity } from "./entity";
import { GameMode } from "../state";
import { Texture } from "pixi.js";
import { TiledTilemap } from "./tilemap";

export class Trapdoor extends Entity {
  constructor(props: {
    texture: Texture;
    //lowerLevel: TiledTilemap;
    //upperLevel: TiledTilemap;
  }) {
    super({
      texture: props.texture,
      collidable: true,
      dynamic: false,
    });
  }

  activeModes = [GameMode.Normal];

  update = () => {
    // Nothing
  };
  collide = (other: Entity) => {
    // change level if collider is player
  };
}
