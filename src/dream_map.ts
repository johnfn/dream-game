import { Entity } from "./library/entity";
import { GameMode, GameState } from "./state";
import { Rect } from "./library/rect";
import { Texture } from "pixi.js";
import { TiledTilemap, MapLayer } from "./library/tilemap";
import { C } from "./constants";
import { TiledObjectJSON, Tile } from "./library/tilemap_types";
import { TextureCache } from "./library/texture_cache";
import { TestEntity } from "./test_entity";
import { Trapdoor } from "./library/trapdoor";
import { Game } from "./game";

type MapLevel = { dreamLayer: Entity | undefined; realityLayer: Entity | undefined };
export class DreamMap extends Entity {
  activeModes = [GameMode.Normal];
  map: TiledTilemap;
  levels: { [key: number]:  MapLevel} = [];

  constructor(gameState: GameState) {
    super({
      texture: Texture.EMPTY,
      collidable: false,
      dynamic: false
    });

    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json: C.Loader.getResource("maps/map.json").data,
      renderer: C.Renderer,
      customObjects: [
        {
          type: "single" as const,

          name: "downStair",
          getInstanceType: (tex: Texture) =>
            new Trapdoor({ texture: tex, stairType: "down" })
        },

        {
          type: "group" as const,

          names: ["upStair1", "upStair2"],
          getInstanceType: (tex: Texture) =>
            new Trapdoor({ texture: tex, stairType: "up" })
        },

        {
          type: "group" as const,

          names: ["doorLeft", "doorRight"],
          getInstanceType: (tex: Texture) => new TestEntity(tex)
        },

        {
          type: "single" as const,

          name: "characterStart",
          getInstanceType: (tex: Texture) => new TestEntity(tex)
        } as const
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
    this.updateLevel(gameState.level, gameState)
  }

  updateLevel = (level: number, gameState: GameState) => {
    this.removeChild(this.levels[gameState.level].dreamLayer!);
    this.removeChild(this.levels[gameState.level].realityLayer!);

    gameState.level = level;

    gameState.dreamMapLayer = this.levels[gameState.level].dreamLayer!;
    gameState.realityMapLayer = this.levels[gameState.level].realityLayer!;

    console.log(this.levels[gameState.level].realityLayer!);
    this.addChild(this.levels[gameState.level].dreamLayer!)
    this.addChild(this.levels[gameState.level].realityLayer!)
  };

  loadAllLayers = (layers: {layerName: string, entity: Entity}[]) => {
    for (let {layerName, entity} of layers) {
      const s = layerName.split(" ");

      const layerType = s[0]; //'Reality' or 'Dream'
      const layerLevel = Number(s[s.length - 1]);

      if (!(layerLevel in this.levels)) {
        this.levels[layerLevel] = {dreamLayer: undefined, realityLayer: undefined}
      }

      if (layerType === "Dream" && s[1] === "Ground") {
        this.levels[layerLevel].dreamLayer = entity;
      } else if  (layerType === "Reality" && s[1] === "Ground") {
        this.levels[layerLevel].realityLayer = entity;
      }
    }
  }

  collide = (other: Entity, intersection: Rect) => {
    return null;
  };

  update = (gameState: GameState) => {
  };

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
