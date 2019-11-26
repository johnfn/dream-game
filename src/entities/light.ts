import { GameState, GameMode } from "../state";
import { Texture } from "pixi.js";
import { LightSource } from "../light_source";
import { BaseLight } from "./base_light";
import { CollisionGrid } from "../collision_grid";
import { Rect } from "../library/rect";

export class Light extends BaseLight {
  activeModes  = [GameMode.Normal];
  name         = "Light";
  lightSource  : LightSource;
  rendered     = false;
  tick         = 0;
  intensity    : number;
  flickering   : boolean;

  constructor(texture: Texture, state: GameState, props: { [key: string]: unknown }) {
    super({
      collidable : false,
      texture    ,
      transparent: true,
    });

    const intensity = props.intensity as number | undefined;
    const flickering = props.flickering as boolean | undefined;

    if (!intensity) {
      throw new Error("Intensity not defined for a light in the tilemap!");
    }

    this.lightSource = new LightSource();
    this.lightSource.x = 0;
    this.lightSource.y = 0;
    this.lightSource.alpha = Number(intensity);

    this.intensity  = intensity;
    this.flickering = flickering || false;

    state.stage.addChild(this.lightSource);
  }

  collide = () => {};

  update = (state: GameState) => {

  };

  renderLight(state: GameState, grid: CollisionGrid): void {
    const w = 1500;
    const h = 1500;
    const boundary = new Rect({
      x: this.x - w / 2,
      y: this.y - h / 2,
      w: w,
      h: h,
    });
    const { graphics, offsetX, offsetY } = this.lightSource.buildLighting(grid, this, boundary);

    // sort to top lol
    state.stage.removeChild(this.lightSource);
    state.stage.addChild(this.lightSource);

    this.lightSource.x = offsetX;
    this.lightSource.y = offsetY;
  }

  duration = 0;

  flicker() {
    if (--this.duration <= 0) {
      this.duration = Math.random() * 80 + 10;

      if (this.lightSource.alpha === 0) {
        this.lightSource.alpha = this.intensity;
      } else {
        this.lightSource.alpha = 0;
      }
    }
  }

  updateLight(state: GameState, grid: CollisionGrid): void {
    if (!this.rendered) {
      this.rendered = true;

      this.renderLight(state, grid);
    }

    if (this.flickering) {
      this.flicker();
    }

    // this.renderLight(state, grid);

    // TODO: Check if visible
    // TODO: Check if moved

  }
}
