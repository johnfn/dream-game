import { Entity } from "./library/entity";
import { GameMode, GameState } from "./state";
import { Rect } from "./library/rect";
import { Texture } from "pixi.js";
import { TiledTilemap } from "./library/tilemap";
import { C } from "./constants";
import { TextureEntity } from "./texture_entity";
import { Trapdoor } from "./library/trapdoor";
import { Door } from "./entities/door";
import { CharacterStart } from "./entities/character_start";
import { Glass } from "./entities/glass";
import { LockedDoor } from "./entities/locked_door";
import { TreasureChest } from "./entities/treasure_chest";
import { Light } from "./entities/light";

type MapLevel = {
  dreamGroundLayer  : Entity | undefined;
  realityGroundLayer: Entity | undefined;
  dreamObjectLayer  : Entity | undefined;
  realityObjectLayer: Entity | undefined;
};

export class DreamMap extends Entity {
  activeModes   = [GameMode.Normal];
  map           : TiledTilemap;
  levels        : { [key: number]: MapLevel } = [];
  activeRegion  : Rect | null;
  _cameraRegions: Rect[] = [];

  constructor(gameState: GameState) {
    super({
      collidable: false,
    });

    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json: C.Loader.getResource("maps/map.json").data,
      renderer: C.Renderer,
      customObjects: [
        {
          type: "group" as const,

          names: ["downStair"],
          getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "downStair" }),
          getGroupInstanceType: () => new Trapdoor({stairType: "down"})
        },

        {
          type: "group" as const,

          names: ["upStair1", "upStair2"],
          getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "upStair" }),
          getGroupInstanceType: () => new Trapdoor({stairType: "up"})
        },

        {
          type: "group" as const,

          names: ["doorLeft", "doorRight"],
          getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "door" }),
          getGroupInstanceType: () => new Door()
        },

        {
          type: "group" as const,

          names: ["lockedDoorLeft", "lockedDoorRight"],
          getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "door" }),
          getGroupInstanceType: () => new LockedDoor()
        },

        {
          type: "single" as const,

          name: "characterStart",
          getInstanceType: (tex: Texture) => new CharacterStart(),
        },
        
        {
          type: "single" as const,

          name: "treasureChest",
          getInstanceType: (tex: Texture, props: { [key: string]: unknown }) => new TreasureChest(tex, props),
        },

        {
          type: "single" as const,

          name: "light",
          getInstanceType: (tex: Texture, props: { [key: string]: unknown }) => new Light(tex, props),
        },

        {
          type: "single" as const,

          name: "glass",
          getInstanceType: (tex: Texture) => new Glass(tex),
        },

        {
          type     : "rect" as const,
          layerName: "Camera Bounds",
          process  : (cameraBound) => this._cameraRegions.push(cameraBound),
        },
      ]
    });

    this.map            = tilemap;
    this._cameraRegions = this.map.loadRegionLayer("Camera Bounds");
    this.activeRegion   = null;
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

  loadNewRegion = (region: Rect, state: GameState) => {
    // Step 1: Clear off all old objects from previous region

    for (const obj of this.map.getCustomObjectEntities()) {
      obj.betterDestroy(state);
    }

    // Step 2: Load next region

    const layers = this.map.loadRegion(region);

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

  update = (state: GameState) => {
    const character        = state.character;
    const regions          = this._cameraRegions;
    const nextActiveRegion = regions.find(region => region.contains(character.positionVector()));

    if (nextActiveRegion && !nextActiveRegion.equals(this.activeRegion)) {
      this.loadNewRegion(nextActiveRegion, state);
    }
  }; 

  getCollidersInRegion(region: Rect): Rect[] {
    return this.map.getCollidersInRegion(region);
  }
}
