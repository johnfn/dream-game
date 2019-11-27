import { GameState, GameMode } from "../state";
import { Texture, Graphics, RenderTexture, Sprite } from "pixi.js";
import { Entity } from "../library/entity";
import { C } from "../constants";
import { Rect } from "../library/rect";
import { RectGroup } from "../library/rect_group";
import { DreamMap } from "../map/dream_map";

export class DreamBlob extends Entity {
  activeModes          = [GameMode.Normal];
  name                 = "DreamBlob";
  open                 = false;
  needsToRender        = true;
  blobWidth            = 800;
  blobHeight           = 800;
  dreamMap             : Sprite;
  dreamMapMask         : Graphics;

  dreamBlobInverse     : Sprite;
  dreamBlobInverseMask : Graphics;
  map                 !: DreamMap;

  xRelativeToRegion    : number = 0;
  yRelativeToRegion    : number = 0;

  constructor(texture: Texture) {
    super({
      collidable: true,
      texture   ,
    });

    this.dreamMap     = new Sprite();
    this.dreamMapMask = new Graphics();

    this.dreamBlobInverse     = new Sprite();
    this.dreamBlobInverseMask = new Graphics();
  }

  collide = () => {};

  renderBlob(state: GameState, activeCameraRegion: Rect): Sprite {
    this.xRelativeToRegion = this.x - activeCameraRegion.x;
    this.yRelativeToRegion = this.y - activeCameraRegion.y;

    const layers = state.map.getActiveDreamLayers();

    const dreamMapTexture = RenderTexture.create({
      width : activeCameraRegion.w,
      height: activeCameraRegion.h,
    });

    for (const layer of layers) {
      const oldX = layer.entity.x;
      const oldY = layer.entity.y;

      layer.entity.x = 0;
      layer.entity.y = 0;

      C.Renderer.render(layer.entity, dreamMapTexture, false);

      layer.entity.x = oldX;
      layer.entity.y = oldY;
    }

    const dreamMap = new Sprite(dreamMapTexture);

    state.stage.addChild(dreamMap);
    
    dreamMap.x = activeCameraRegion.x;
    dreamMap.y = activeCameraRegion.y;

    this.dreamMapMask = new Graphics();

    this.dreamMapMask.x = activeCameraRegion.x;
    this.dreamMapMask.y = activeCameraRegion.y;

    state.stage.addChild(this.dreamMapMask);

    return dreamMap;
  }

  tick = 0;

  update = (state: GameState) => {
    ++this.tick;

    const activeCameraRegion = state.camera.currentRegion();

    if (activeCameraRegion && this.collisionBounds(state).intersects(activeCameraRegion)) {
      if (this.needsToRender) {
        this.dreamMap = this.renderBlob(state, activeCameraRegion);

        this.needsToRender = false;
      }
    }

    const blobWidth  = 300 + Math.sin(this.tick / 300) * 300; 
    const blobHeight = 300;

    this.dreamMapMask.clear();
    this.dreamMapMask.beginFill(0xff0000);
    this.dreamMapMask.drawRect(this.xRelativeToRegion, this.yRelativeToRegion, blobWidth, blobHeight);

    this.dreamMap.mask = this.dreamMapMask;

    // this.dreamBlobInverseMask.clear();
    // this.dreamBlobInverseMask.beginFill(0xff0000);
    // this.dreamBlobInverseMask.drawRect(0, 0, 800, 800);
    // this.dreamBlobInverseMask.beginHole()
    // this.dreamBlobInverseMask.drawRect(0, 0, blobWidth, blobHeight);
    // this.dreamBlobInverseMask.endHole()
  };

  collisionBounds(state: GameState): RectGroup {
    return state.map.getDreamCollidersInRegion(new Rect({
      x: this.x + this.dreamMapMask.x,
      y: this.y + this.dreamMapMask.y,
      w: this.dreamMapMask.width,
      h: this.dreamMapMask.height,
    }))
  }
}
