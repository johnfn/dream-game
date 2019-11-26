import { GameState, GameMode } from "../state";
import { Texture } from "pixi.js";
import { LightSource } from "../light_source";
import { BaseLight } from "./base_light";
import { CollisionGrid } from "../collision_grid";

export class Light extends BaseLight {
  activeModes  = [GameMode.Normal];
  name         = "Light";
  lightSource  : LightSource;
  rendered     = false;
  // lightGraphics: Graphics;

  constructor(texture: Texture, state: GameState, props: { [key: string]: unknown }) {
    super({
      collidable: false,
      texture   ,
    });

    const intensity = props.intensity as number | undefined;

    if (!intensity) {
      throw new Error("Intensity not defined for a light in the tilemap!");
    }

    this.lightSource = new LightSource();
    this.lightSource.x = 0;
    this.lightSource.y = 0;
    this.lightSource.alpha = 0.3;

    state.stage.addChild(this.lightSource);
  }

  collide = () => {};

  update = (state: GameState) => {

  };

  renderLight(state: GameState, grid: CollisionGrid): void {
    const { graphics, offsetX, offsetY } = this.lightSource.buildLighting(state, grid, this);

    // sort to top lol
    state.stage.removeChild(this.lightSource);
    state.stage.addChild(this.lightSource);

    this.lightSource.x = offsetX;
    this.lightSource.y = offsetY;
  }

  updateLight(state: GameState, grid: CollisionGrid): void {
    if (!this.rendered) {
      this.rendered = true;

      this.renderLight(state, grid);
    }

    this.renderLight(state, grid);

    // TODO: Check if visible
    // TODO: Check if moved

  }
}
