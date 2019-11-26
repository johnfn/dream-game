import { Entity } from "../library/entity";
import { GameMode, GameState } from "../state";
import { Rect } from "../library/rect";
import { TiledTilemap } from "../library/tilemap";
import { C } from "../constants";
import { CustomMapObjects } from "./custom_map_objects";
import { RectGroup } from "../library/rect_group";
import { FollowCamera } from "../camera";

type MapLevel = {
  dreamGroundLayer  : Entity | undefined;
  realityGroundLayer: Entity | undefined;
  dreamObjectLayer  : Entity | undefined;
  realityObjectLayer: Entity | undefined;
};

type DreamMapLayer = {
  entity   : Entity;
  layerName: string;
  region   : Rect;
  active   : boolean;
};

export class DreamMap extends Entity {
  activeModes           = [GameMode.Normal];
  map                   : TiledTilemap;
  levels                : { [key: number]: MapLevel } = [];
  activeRegion          : Rect | null;
  mapLayers             : DreamMapLayer[] = [];

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

    this.loadNextRegionIfNecessary(state);
  }

  getCameraRegions(): Rect[] {
    return this._cameraRegions;
  }

  updateLevel = (level: number, gameState: GameState) => {
    if (level < 0 || level > 2) return;

    this.removeChild(
      this.levels[gameState.level].dreamGroundLayer!,
      this.levels[gameState.level].realityGroundLayer!,
      this.levels[gameState.level].dreamObjectLayer!,
      this.levels[gameState.level].realityObjectLayer!
    );

    gameState.level = level;

    gameState.dreamMapLayer = this.levels[gameState.level].dreamGroundLayer!;
    gameState.realityMapLayer = this.levels[
      gameState.level
    ].realityGroundLayer!;

    this.addChild(
      this.levels[gameState.level].dreamGroundLayer!,
      this.levels[gameState.level].realityGroundLayer!,
      this.levels[gameState.level].dreamObjectLayer!,
      this.levels[gameState.level].realityObjectLayer!
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

    // TODO: There's like no way this will work. How does this work?

    const layers = this.map.loadRegion(region);

    for (const oldLayer of this.mapLayers) {
      oldLayer.entity.alpha = 0.15;
      oldLayer.active = false;
    }

    for (const layer of layers) {
      this.mapLayers.push({
        entity   : layer.entity,
        layerName: layer.layerName,
        region   : region,
        active   : true,
      });
    }

    // Step 2: Load next region

    for (let { layerName, entity } of layers) {
      const s = layerName.split(" ");

      const layerType = s[0] + " " + s[1]; // ie. 'Reality Object'
      const layerLevel = Number(s[s.length - 1]);

      if (!(layerLevel in this.levels)) {
        this.levels[layerLevel] = {
          dreamGroundLayer  : undefined,
          realityGroundLayer: undefined,
          dreamObjectLayer  : undefined,
          realityObjectLayer: undefined
        };
      }

      if (layerType === "Dream Ground") {
        this.levels[layerLevel].dreamGroundLayer = entity;
      } else if (layerType === "Reality Ground") {
        this.levels[layerLevel].realityGroundLayer = entity;
      } else if (layerType === "Dream Object") {
        this.levels[layerLevel].dreamObjectLayer = entity;
      } else if (layerType === "Reality Object") {
        this.levels[layerLevel].realityObjectLayer = entity;
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
    return this.map.getCollidersInRegionForLayer(
      this._camera.bounds().expand(1000),
      "Reality Ground Layer 1"
    )
  }

  getDreamCollidersInRegion(region: Rect): RectGroup {
    return this.map.getCollidersInRegionForLayer(
      region, "Dream Ground Layer 1"
    )
  }
}
