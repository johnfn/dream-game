import { Entity } from "../library/entity";
import { GameMode, GameState } from "../state";
import { Rect } from "../library/rect";
import { TiledTilemap } from "../library/tilemap";
import { C } from "../constants";
import { CustomMapObjects } from "./custom_map_objects";
import { RectGroup } from "../library/rect_group";
import { FollowCamera } from "../camera";
import { ObjectInfo } from "../library/tilemap_objects";

type MapLevel = {
  realityGroundLayer: Entity | undefined;
  realityWallLayer  : Entity | undefined;
  realityObjectLayer: Entity | undefined;
  dreamGroundLayer  : Entity | undefined;
  dreamWallLayer  : Entity | undefined;
  dreamObjectLayer  : Entity | undefined;
};

type DreamMapLayer = {
  entity       : Entity;
  layerName    : string;
  region       : Rect;
  active       : boolean;
  objectLayer  : boolean;
};

export class DreamMap extends Entity {
  name         = "DreamMap";
  activeModes  = [GameMode.Normal];
  map          : TiledTilemap;
  levels       : { [key: number]: MapLevel } = [];
  activeRegion : Rect | null;
  mapLayers    : DreamMapLayer[] = [];

  private _cameraRegions: Rect[] = [];
  private _camera       : FollowCamera;

  constructor(state: GameState) {
    super({
      collidable: false,
    });

    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json         : C.Loader.getResource("maps/map.json").data,
      renderer     : C.Renderer,
      customObjects: CustomMapObjects,
    });

    this.map            = tilemap;
    this._cameraRegions = this.map.loadRegionLayer("Camera Bounds");
    this.activeRegion   = null;
    this._camera        = state.camera;
    this.zIndex         = 0;

    this.loadNextRegionIfNecessary(state);
  }

  getCameraRegions(): Rect[] {
    return this._cameraRegions;
  }

  updateLevel = (level: number, gameState: GameState) => {
    if (level < 0 || level > 2) return;

    this.removeChild(
      this.levels[gameState.level].realityGroundLayer!,
      this.levels[gameState.level].realityWallLayer!,
      this.levels[gameState.level].realityObjectLayer!,
      this.levels[gameState.level].dreamGroundLayer!,
      this.levels[gameState.level].dreamObjectLayer!,
    );

    gameState.level = level;

    gameState.dreamMapLayer = this.levels[gameState.level].dreamGroundLayer!;
    gameState.realityMapLayer = this.levels[
      gameState.level
    ].realityGroundLayer!;

    this.addChild(
      this.levels[gameState.level].realityGroundLayer!,
      this.levels[gameState.level].realityWallLayer!,
      this.levels[gameState.level].realityObjectLayer!,
      this.levels[gameState.level].dreamGroundLayer!,
      this.levels[gameState.level].dreamObjectLayer!,
    );
  };

  getActiveLayers = (): DreamMapLayer[] => {
    return this.mapLayers.filter(layer => layer.active);
  }

  getActiveDreamLayers = (): DreamMapLayer[] => {
    return this.mapLayers.filter(layer => layer.active && layer.layerName.includes("Dream"));
  }

  loadNewRegion = (region: Rect, state: GameState) => {
    // Step 1: Clear out old region

    for (const oldLayer of this.mapLayers) {
      oldLayer.entity.alpha = 0.15;
      oldLayer.active = false;
    }

    let layers = this.mapLayers.filter(layer => layer.region.equals(region));

    if (layers.length === 0) {
      layers = this.map.loadRegion(region).map(mapLayer => {
        return {
          entity     : mapLayer.entity,
          layerName  : mapLayer.layerName,
          region     : region,
          active     : true,
          objectLayer: mapLayer.objectLayer,
        };
      });

      for (const layer of layers) {
        if (!layer.objectLayer) {
          this.mapLayers.push(layer);
        }
      }
    }

    for (const layer of layers) {
      layer.entity.alpha = 1;
      layer.active = true;
    }

    // Step 2: Load next region

    for (let { layerName, entity } of layers) {
      const s = layerName.split(" ");
      
      const awakeType  = s[0]; // Dream or Reality
      const layerType  = s[1]; // Ground, Wall, or Object
      const layerLevel = Number(s[s.length - 1]);

      //if (!(["Dream", "Reality"].includes(awakeType))) {console.error("awaketype is " + awakeType)}
      //if (!(["Object", "Ground", "Wall"].includes(layerType))) {console.error("layertype is " + layerType)}

      if (!(layerLevel in this.levels)) {
        this.levels[layerLevel] = {
          realityObjectLayer: undefined,
          realityGroundLayer: undefined,
          realityWallLayer  : undefined,
          dreamGroundLayer  : undefined,
          dreamObjectLayer  : undefined,
          dreamWallLayer    : undefined,
        };
      }

      if (awakeType === "Dream") {
        if (layerType === "Ground") {
          this.levels[layerLevel].dreamGroundLayer = entity;
        } else if (layerType === "Wall") {
          this.levels[layerLevel].dreamWallLayer = entity;
        } else if (layerType === "Object") {
          this.levels[layerLevel].dreamObjectLayer = entity;
        }
      } else if (awakeType === "Reality") {
        if (layerType === "Ground") {
          this.levels[layerLevel].realityGroundLayer = entity;
        } else if (layerType === "Wall") {
          this.levels[layerLevel].realityWallLayer = entity;
        } else if (layerType === "Object") {
          this.levels[layerLevel].realityObjectLayer = entity;
        }
      }
    }

    this.updateLevel(state.level, state);

    this.activeRegion = region;
  };

  collide = (other: Entity, intersection: Rect) => {
    return null;
  };

  loadNextRegionIfNecessary = (state: GameState) => {
    const character        = state.character;
    const regions          = this._cameraRegions;
    const nextActiveRegion = regions.find(region => region.contains(character.positionVector()));

    if (nextActiveRegion && !nextActiveRegion.equals(this.activeRegion)) {
      this.loadNewRegion(nextActiveRegion, state);
    }
  }

  update = (state: GameState) => {
    this.loadNextRegionIfNecessary(state);
  }; 

  collisionBounds(state: GameState): RectGroup {
    const bounds = this._camera.bounds().expand(1000);
    const groundRects = this.map.getCollidersInRegionForLayer(
      bounds,
      "Reality Ground Layer 1"
    );
    const wallRects = this.map.getCollidersInRegionForLayer(
      bounds,
      "Reality Wall Layer 1"
    );
    const allRects = new RectGroup(groundRects.getRects().concat(wallRects.getRects()));

    const blobs = state.getDreamBlobs();
    const rectsNotInBlob: Rect[] = [];

    nextRect:
    for (const rect of allRects.getRects()) {
      for (const blob of blobs.values()) { 
        if (rect.intersects(blob.bounds())) {
          const tiles = this.map.getTilesAtAbsolutePosition(rect.x, rect.y);

          if (tiles.length > 1) {
            continue nextRect;
          }
        }
      }

      rectsNotInBlob.push(rect);
    }

    return new RectGroup(rectsNotInBlob);
  }

  getDreamCollidersInRegion(region: Rect): RectGroup {
    return this.map.getCollidersInRegionForLayer(
      region, "Dream Ground Layer 1"
    )
  }

  getAllObjects(): ObjectInfo[] {
    return this.map.getAllObjects();
  }
}
