import { GameState, GameMode } from "../state";
import { Texture, Graphics, RenderTexture, Sprite } from "pixi.js";
import { Entity } from "../library/entity";
import { C } from "../constants";
import { Rect } from "../library/rect";

export class DreamBlob extends Entity {
  activeModes    = [GameMode.Normal];
  name           = "Sign";
  open           = false;
  needsToRender  = true;
  blobWidth      = 800;
  blobHeight     = 800;

  dreamBlob      : Sprite
  dreamBlobMask  : Graphics;

  constructor(texture: Texture) {
    super({
      collidable: false,
      texture,
    });

    this.dreamBlob     = new Sprite();

    this.dreamBlobMask = new Graphics();
    this.dreamBlobMask.beginFill(0xff0000)
    this.dreamBlobMask.drawRect(0, 0, 400, 400);
    this.dreamBlobMask.alpha = 0.1;
  }

  collide = () => {};

  renderBlob(state: GameState, activeCameraRegion: Rect) {
    const layers = state.map.getActiveDreamLayers();

    const renderTexture = RenderTexture.create({
      width : this.blobWidth + 400,
      height: this.blobHeight + 400,
    });

    for (const layer of layers) {
      layer.entity.x -= this.x;
      layer.entity.y -= this.y;

      C.Renderer.render(layer.entity);

      this.dreamBlob.addChild(layer.entity);
    }

    this.dreamBlob.texture = renderTexture;
    this.dreamBlob.mask    = this.dreamBlobMask;

    this.addChild(this.dreamBlob);
    this.addChild(this.dreamBlobMask);
  }

  update = (state: GameState) => {
    const activeCameraRegion = state.camera.currentRegion();

    if (activeCameraRegion && activeCameraRegion.intersects(this.myGetBounds())) {
      if (this.needsToRender) {
        this.renderBlob(state, activeCameraRegion);

        this.needsToRender = false;
      }
    }

    this.dreamBlobMask.width  += (Math.random() - 0.5) * 1;
    this.dreamBlobMask.height += (Math.random() - 0.5) * 1;
  };
}
