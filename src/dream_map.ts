import { Entity } from "./library/entity";
import { GameMode, GameState } from "./state";
import { Rect } from "./library/rect";
import { Texture } from "pixi.js";
import { TiledTilemap } from "./library/tilemap";
import { C } from "./constants";
import { TiledObjectJSON, Tile } from "./library/tilemap_types";
import { TextureCache } from "./library/texture_cache";
import { TestEntity } from "./test_entity";

export class DreamMap extends Entity {
  activeModes = [GameMode.Normal];
  map: TiledTilemap;

  constructor(gameState: GameState) {
    super({
      texture: Texture.EMPTY,
      collidable: false,
      dynamic: false,
    });

    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json: C.Loader.getResource("maps/map.json").data,
      renderer: C.Renderer,
      buildCustomObject: this.buildCustomObject,
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
      } else if (layerName === "Object Layer TODO") {
        gameState.objectLayer = entity;
      }

      this.addChild(entity);
    }
  }

  buildCustomObject = (obj: TiledObjectJSON, tile: Tile): Entity | null => {
    console.log(obj.properties);

    if (obj.gid === 36 || obj.gid === 37) {
      // Left or right half of door

      const spriteTex = TextureCache.GetTextureForTile(tile);
      const entity = new TestEntity(spriteTex);

      entity.x = tile.x;
      entity.y = tile.y;

      return entity;
    }

    console.log(`unhandled gid ${ obj.gid }`);

    return null;
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