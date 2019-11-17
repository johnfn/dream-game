import { Entity } from "./library/entity";
import { GameMode, GameState } from "./state";
import { Rect } from "./library/rect";
import { Texture } from "pixi.js";
import { TiledTilemap } from "./library/tilemap";
import { C } from "./constants";

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
      renderer: C.Renderer
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

    for (const { layerName, sprite } of layers) {
      if (layerName === "Dream Layer") {
        gameState.dreamMapLayer   = sprite;
      } else if (layerName === "Reality Ground Layer") {
        gameState.realityMapLayer = sprite;
      }

      this.addChild(sprite);
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