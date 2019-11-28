import { GameState, GameMode } from "../state";
import { Graphics, RenderTexture } from "pixi.js";
import { Entity } from "../library/entity";
import { C } from "../constants";
import { Rect } from "../library/rect";
import { RectGroup } from "../library/rect_group";
import { DreamMap } from "../map/dream_map";
import { TextureEntity } from "../texture_entity";

export class DreamBlob extends Entity {
  activeModes       = [GameMode.Normal];
  name              = "DreamBlob";
  open              = false;
  needsToRender     = true;
  blobWidth         = 800;
  blobHeight        = 800;
  dreamMap          : Entity;
  dreamMapMask      : Graphics;

  dreamMapOuter     : Entity;
  dreamMapOuterMask : Graphics;
  map              !: DreamMap;

  associatedRegion  : Rect = new Rect({ x: 0, y: 0, w: 1, h: 1 });

  constructor() {
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

  renderBlob(state: GameState): {
    dreamMap     : Entity;
    dreamMapOuter: Entity;
  } {
    const layers = state.map.getActiveDreamLayers();

    const dreamMapTexture = RenderTexture.create({
      width : 2000,
      height: 2000,
    });

    for (const layer of layers) {
      const oldX = layer.entity.x;
      const oldY = layer.entity.y;

      layer.entity.x -= this.x;
      layer.entity.y -= this.y;

      C.Renderer.render(layer.entity, dreamMapTexture, false);

      layer.entity.x = oldX;
      layer.entity.y = oldY;
    }

    for (const object of this.map.getAllObjects()) {
      if (object.entity === this) { continue; } // lol

      const oldX = object.entity.x;
      const oldY = object.entity.y;

      object.entity.x -= this.x;
      object.entity.y -= this.y;

      let oldVisible = object.entity.visible;

      object.entity.visible = true;

      C.Renderer.render(object.entity, dreamMapTexture, false);

      object.entity.visible = oldVisible;
      
      object.entity.x = oldX;
      object.entity.y = oldY;
    }

    // Outer region

    const dreamMapOuter = new TextureEntity({ 
      name   : "DreamMapOuter",
      texture: dreamMapTexture,
    });

    state.stage.addChild(dreamMapOuter);

    dreamMapOuter.x = this.x;
    dreamMapOuter.y = this.y;

    dreamMapOuter.alpha = 0.1;

    // Inner region 

    const dreamMap = new TextureEntity({
      name   : "DreamMapMain",
      texture: dreamMapTexture
    });

    state.stage.addChild(dreamMap);
    
    dreamMap.x = this.x;
    dreamMap.y = this.y;

    this.dreamMapMask = new Graphics();

    return { dreamMap, dreamMapOuter };
  }

  tick = 0;

  update = (state: GameState) => {
    console.log("hewo", this.x, this.y);

    ++this.tick;

    this.map = state.map;
    this.associatedRegion = state.map.getCameraRegions().find(region => region.contains(this.positionVector()))!;

    if (this.needsToRender) {
      const { dreamMap, dreamMapOuter } = this.renderBlob(state);

      this.dreamMap      = dreamMap;
      this.dreamMapOuter = dreamMapOuter;

      this.needsToRender = false;
    }

    this.blobWidth  = 500 + Math.sin(this.tick / 300) * 500; 
    this.blobHeight = 300;

    this.dreamMapMask.clear();
    this.dreamMapMask.beginFill(0xff0000);
    this.dreamMapMask.drawRect(0, 0, this.blobWidth, this.blobHeight);

    this.dreamMap.addChild(this.dreamMapMask);
    this.dreamMap.mask = this.dreamMapMask;
  };

  bounds(): Rect {
    return new Rect({
      x: this.x,
      y: this.y,
      w: this.blobWidth,
      h: this.blobHeight,
    });
  }

  collisionBounds(state: GameState): RectGroup {
    return state.map.getDreamCollidersInRegion(this.bounds())
  }
}
