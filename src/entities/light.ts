import { GameState, GameMode } from "../state";
import { Entity } from "../library/entity";
import { Texture } from "pixi.js";
import { LightSource } from "../light_source";

export class Light extends Entity {
  activeModes  = [GameMode.Normal];
  name         = "Light";
  lightSource  : LightSource;
  // lightGraphics: Graphics;

  constructor(texture: Texture, props: { [key: string]: unknown }) {
    super({
      collidable: false,
      texture   ,
    });

    this.lightSource = new LightSource();

    // const { graphics, offsetX, offsetY } = this.lightSource.buildLighting();
  }

  collide = () => {};

  update = (state: GameState) => {

  };
}
