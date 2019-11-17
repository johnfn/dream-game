import { Entity } from "./library/entity";
import { GameMode, GameState } from "./state";
import { Rect } from "./library/rect";
import { Texture } from "pixi.js";
import { TiledTilemap } from "./library/tilemap";
import { C } from "./constants";
import { TestEntity } from "./test_entity";
import { Trapdoor } from "./library/trapdoor";
import { Door } from "./door";

export class DreamMap extends Entity {
  activeModes = [GameMode.Normal];
  map: TiledTilemap;

  constructor(gameState: GameState) {
    super({
      collidable: false,
      dynamic: false,
    });

    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json: C.Loader.getResource("maps/map.json").data,
      renderer: C.Renderer,
      customObjects: [
        {
          type: "single" as const,

          name: "downStair",
          getInstanceType: (tex: Texture) => new Trapdoor({ texture: tex }),
        },

        {
          type: "group" as const,

          names: ["upStair1", "upStair2"],
          getInstanceType: (tex: Texture) => new TestEntity(tex),
          getGroupInstanceType: () => new Door(),
        },

        {
          type: "group" as const,

          names: ["doorLeft", "doorRight"],
          getInstanceType: (tex: Texture) => new TestEntity(tex),
          getGroupInstanceType: () => new Door(),
        },

        {
          type: "single" as const,

          name: "characterStart",
          getInstanceType: (tex: Texture) => new TestEntity(tex),
        } as const,
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

    for (const { layerName, entity } of layers) {
      if (layerName === "Dream Layer") {
        gameState.dreamMapLayer = entity;
      } else if (layerName === "Reality Ground Layer") {
        gameState.realityMapLayer = entity;
      } else if (layerName === "Reality Object Layer 1") {
        gameState.objectLayer = entity;
      }

      this.addChild(entity);
    }
  }

  collide = (other: Entity, intersection: Rect) => {

  }

  update = (gameState: GameState) => {

  }

  doesRectCollideMap(rect: Rect): boolean {
    const tiles = [
      ...this.map.getTilesAt(rect.x         , rect.y),
      ...this.map.getTilesAt(rect.x + rect.w, rect.y),
      ...this.map.getTilesAt(rect.x         , rect.y + rect.h),
      ...this.map.getTilesAt(rect.x + rect.w, rect.y + rect.h),
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