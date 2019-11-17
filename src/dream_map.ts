import { Entity } from "./library/entity";
import { GameMode, GameState } from "./state";
import { Rect } from "./library/rect";
import { Texture } from "pixi.js";
import { TiledTilemap } from "./library/tilemap";
import { C } from "./constants";
import { TiledObjectJSON, Tile } from "./library/tilemap_types";
import { TextureCache } from "./library/texture_cache";
import { TestEntity } from "./test_entity";
import { Trapdoor } from "./library/trapdoor";

export class DreamMap extends Entity {
  activeModes = [GameMode.Normal];
  map: TiledTilemap;

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
      buildCustomObject: this.buildCustomObject
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
      const layerType = layerName.split(" ")[0]; //'Reality' or 'Dream'
      //const layerLevel = Number(layerName.split(" ")[]); //'Reality' or 'Dream'
      console.log(layerType);
      console.log(layerName.split(" ")[-1]);
      if (Number(layerName[-1]) == gameState.level) {
        if (layerType === "Dream") {
          gameState.dreamMapLayer = entity;
        } else if (layerType === "Reality") {
          gameState.realityMapLayer = entity;
        } else if (layerName === "Reality Object Layer 1") { //Fix this later
          gameState.objectLayer = entity;
        }
      }
      
      this.addChild(entity);
    }
  }

  buildCustomObject = (obj: TiledObjectJSON, tile: Tile): Entity | null => {
    console.log(tile.tileProperties);

    if (!tile.tileProperties.type) console.error("uh oh");

    switch (tile.tileProperties.type) {
      case "downStair": {
        const spriteTex = TextureCache.GetTextureForTile(tile);
        const entity = new Trapdoor({ texture: spriteTex, stairType: "down" }); //TODO: get levels from map
        return entity;
      }
      case "upStair1": {
        const spriteTex = TextureCache.GetTextureForTile(tile);
        const entity = new Trapdoor({ texture: spriteTex, stairType: "up" }); //TODO: get levels from map
        return entity;
      }
      case "upStair2":
        break;
      case "characterStart": {
        const spriteTex = TextureCache.GetTextureForTile(tile);
        const entity = new TestEntity(spriteTex);

        entity.x = tile.x;
        entity.y = tile.y;

        return entity;
      }
      case "doorLeft":
      case "doorRight": {
        const spriteTex = TextureCache.GetTextureForTile(tile);
        const entity = new TestEntity(spriteTex);

        entity.x = tile.x;
        entity.y = tile.y;

        return entity;
      }
      case "upStair2":
        break; //Aesthetic only
      case "characterStart":
      case "doorLeft":
      case "doorRight": {
        const spriteTex = TextureCache.GetTextureForTile(tile);
        const entity = new TestEntity(spriteTex);
      }
      default: {
        alert(`unhandled gid ${obj.gid} and type ${tile.tileProperties.type}`);
      }
    }

    return null;
  };

  collide = (other: Entity, intersection: Rect) => {};

  update = (gameState: GameState) => {};

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
