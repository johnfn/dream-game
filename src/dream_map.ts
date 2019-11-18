import { Entity } from "./library/entity";
import { GameMode, GameState } from "./state";
import { Rect } from "./library/rect";
import { Texture } from "pixi.js";
import { TiledTilemap } from "./library/tilemap";
import { C } from "./constants";
import { TextureEntity } from "./texture_entity";
import { Trapdoor } from "./library/trapdoor";
import { Door } from "./door";

type MapLevel = {
  dreamGroundLayer: Entity | undefined;
  realityGroundLayer: Entity | undefined;
  dreamObjectLayer: Entity | undefined;
  realityObjectLayer: Entity | undefined;
};

export class DreamMap extends Entity {
  activeModes = [GameMode.Normal];
  map: TiledTilemap;
  levels: { [key: number]: MapLevel } = [];

  constructor(gameState: GameState) {
    super({
      collidable: false,
      dynamic: false
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
          type: "single" as const,

          name: "characterStart",
          getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "characterStart" })
        }
      ]
    });

    this.map = tilemap;

    const layers = this.map.loadRegionLayers(
      new Rect({
        x: 0,
        y: 0,
        w: 2048,
        h: 2048
      })
    );
    this.loadAllLayers(layers);
    this.updateLevel(gameState.level, gameState);
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

  loadAllLayers = (layers: { layerName: string; entity: Entity }[]) => {
    for (let { layerName, entity } of layers) {
      const s = layerName.split(" ");

      const layerType = s[0] + " " + s[1]; // ie. 'Reality Object'
      const layerLevel = Number(s[s.length - 1]);

      if (!(layerLevel in this.levels)) {
        this.levels[layerLevel] = {
          dreamGroundLayer: undefined,
          realityGroundLayer: undefined,
          dreamObjectLayer: undefined,
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
  };

  collide = (other: Entity, intersection: Rect) => {
    return null;
  };

  update = (gameState: GameState) => {}; 

  // TODO: Have to ignore invisible layers. Somehow?!?

  doesMapHaveCollisionAtTile(x: number, y: number): boolean {
    const tiles = this.map.getTilesAt(x, y);

    for (const tile of tiles) {
      if (tile.isCollider) {
        return true;
      }
    }

    return false;
  }

  doesRectCollideMap(rect: Rect): boolean {
    const tiles = [
      ...this.map.getTilesAt(rect.x, rect.y),
      ...this.map.getTilesAt(rect.x + rect.w, rect.y),
      ...this.map.getTilesAt(rect.x, rect.y + rect.h),
      ...this.map.getTilesAt(rect.x + rect.w, rect.y + rect.h)
    ];

    for (const tile of tiles) {
      if (tile !== null) {
        if (tile.isCollider) {
          return true;
        }
      }
    }

    return false;
  }
}
