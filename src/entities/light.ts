import { GameState, GameMode } from "../state";
import { Texture } from "pixi.js";
import { LightSource } from "../light_source";
import { BaseLight } from "./base_light";
import { CollisionGrid } from "../collision_grid";

export class Light extends BaseLight {
  activeModes  = [GameMode.Normal];
  name         = "Light";
  lightSource  : LightSource;
  // lightGraphics: Graphics;

  constructor(texture: Texture, props: { [key: string]: unknown }) {
    super({
      collidable: false,
      texture   ,
    });

    const intensity = props.intensity as number | undefined;

    if (!intensity) {
      throw new Error("Intensity not defined for a light in the tilemap!");
    }

    this.lightSource = new LightSource();
  }

  collide = () => {};

  update = (state: GameState) => {

  };

  updateLight(state: GameState, grid: CollisionGrid): void {
    // TODO: Check if visible
    // TODO: Check if moved

    // const { graphics, offsetX, offsetY } = this.lightSource.buildLighting(state, grid);
  }
}
