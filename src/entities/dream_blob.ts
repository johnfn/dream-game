import { GameState, GameMode } from "../state";
import { Texture, Graphics, RenderTexture, Sprite } from "pixi.js";
import { Entity } from "../library/entity";
import { C } from "../constants";
import { Rect } from "../library/rect";
import { RectGroup } from "../library/rect_group";
import { DreamMap } from "../map/dream_map";
import { TextureEntity } from "../texture_entity";

export class DreamBlob extends Entity {
  activeModes          = [GameMode.Normal];
  name                 = "DreamBlob";
  open                 = false;
  needsToRender        = true;
  blobWidth            = 800;
  blobHeight           = 800;
  dreamMap             : Entity;
  dreamMapMask         : Graphics;

  dreamMapOuter        : Entity;
  dreamMapOuterMask    : Graphics;
  map                 !: DreamMap;

  xRelativeToRegion    : number = 0;
  yRelativeToRegion    : number = 0;
  associatedRegion     : Rect = new Rect({ x: 0, y: 0, w: 1, h: 1 });

  constructor(texture: Texture) {
    super({
      collidable: true,
      texture   : undefined,
    });

    this.dreamMap     = new TextureEntity({});
    this.dreamMapMask = new Graphics();

    this.dreamMapOuter     = new TextureEntity({});
    this.dreamMapOuterMask = new Graphics();
  }

  collide = () => {};

  renderBlob(state: GameState, activeCameraRegion: Rect): {
    dreamMap     : Entity;
    dreamMapOuter: Entity;
  } {
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

    // Outer region

    const dreamMapOuter = new TextureEntity({ 
      name   : "DreamMapOuter",
      texture: dreamMapTexture,
    });

    state.stage.addChild(dreamMapOuter);
    
    dreamMapOuter.x = activeCameraRegion.x;
    dreamMapOuter.y = activeCameraRegion.y;

    dreamMapOuter.alpha = 0.1;

    // Inner region 

    const dreamMap = new TextureEntity({
      name   : "DreamMapMain",
      texture: dreamMapTexture
    });

    state.stage.addChild(dreamMap);
    
    dreamMap.x = activeCameraRegion.x;
    dreamMap.y = activeCameraRegion.y;

    this.dreamMapMask = new Graphics();

    return { dreamMap, dreamMapOuter };
  }

  tick = 0;

  update = (state: GameState) => {
    ++this.tick;

    this.associatedRegion = state.map.getCameraRegions().find(region => region.contains(this.positionVector()))!;

    if (this.needsToRender) {
      const { dreamMap, dreamMapOuter } = this.renderBlob(state, this.associatedRegion);

      this.dreamMap      = dreamMap;
      this.dreamMapOuter = dreamMapOuter;

      this.needsToRender = false;
    }

    this.blobWidth  = 300 + Math.sin(this.tick / 300) * 300; 
    this.blobHeight = 300;

    this.dreamMapMask.clear();
    this.dreamMapMask.beginFill(0xff0000);
    this.dreamMapMask.drawRect(this.xRelativeToRegion, this.yRelativeToRegion, this.blobWidth, this.blobHeight);

    this.dreamMap.addChild(this.dreamMapMask);
    this.dreamMap.mask = this.dreamMapMask;

    // this.dreamBlobInverseMask.clear();
    // this.dreamBlobInverseMask.beginFill(0xff0000);
    // this.dreamBlobInverseMask.drawRect(0, 0, 800, 800);
    // this.dreamBlobInverseMask.beginHole()
    // this.dreamBlobInverseMask.drawRect(0, 0, blobWidth, blobHeight);
    // this.dreamBlobInverseMask.endHole()
  };

  bounds(): Rect {
    return new Rect({
      x: this.associatedRegion.x + this.xRelativeToRegion,
      y: this.associatedRegion.y + this.yRelativeToRegion,
      w: this.blobWidth,
      h: this.blobHeight,
    });
  }

  collisionBounds(state: GameState): RectGroup {
    return state.map.getDreamCollidersInRegion(this.bounds())
  }
}
