import { Sprite, Renderer, RenderTexture } from 'pixi.js'
import { Rect } from './rect'
import { TiledJSON, Tileset, Tile, SpritesheetTile, TiledObjectLayerJSON, TiledTileLayerJSON } from './tilemap_types';
import { TextureCache } from './texture_cache';
import { ResourceName } from '../resources';

// 2D array that allows for negative indices
class Grid<T> {
  private _data: { [key: number]: { [key: number]: T} } = {};

  set(x: number, y: number, value: T) {
    if (!this._data[x]) {
      this._data[x] = {};
    }

    this._data[x][y] = value;
  }

  get(x: number, y: number): T | null {
    if (!this._data[x]) {
      return null;
    }

    if (this._data[x][y] === undefined) {
      return null;
    }

    return this._data[x][y];
  }

  getOrDefault(x: number, y: number, otherwise: T): T {
    const result = this.get(x, y);

    if (result === null) {
      return otherwise;
    } else {
      return result;
    }
  }
}

// TODO: Handle the weird new file format where tilesets link to ANOTHER json file

export class TiledTilemap {
  private data: TiledJSON;
  private tileWidth: number;
  private tileHeight: number;
  private tilesets: Tileset[];
  private layers: { [tilesetName: string]: Grid<Tile> };
  private renderer: Renderer;
  private gidHasCollision: { [id: number]: boolean } = {};

  constructor({ json: data, renderer, pathToTilemap }: { 
    // this is required to calculate the relative paths of the tileset images.
    json         : TiledJSON; 
    renderer     : Renderer; 
    pathToTilemap: string;
  }) {
    this.data = data;
    this.tileHeight = data.tileheight;
    this.tileWidth = data.tilewidth;
    this.renderer = renderer;

    this.tilesets = TiledTilemap.LoadTilesets(pathToTilemap, this.data);

    this.gidHasCollision = this.buildCollisionInfoForTiles()

    this.layers = this.loadLayers();
  }

  private buildCollisionInfoForTiles(): { [key: number]: boolean } {
    // Build a dumb (for now) object of collision ids by just checking if the
    // tile literally has any collision object at all and takes that to mean the
    // entire thing is covered.

    // We could improve this if we want!

    const gidHasCollision: { [id: number]: boolean } = {};

    for (const tileset of this.data.tilesets) {
      if (tileset.tiles) {
        for (const tileAndCollisionObjects of tileset.tiles) {
          if (tileAndCollisionObjects.objectgroup.objects.length > 0) {
            gidHasCollision[
              tileAndCollisionObjects.id + tileset.firstgid
            ] = true;
          }
        }
      }
    }

    return gidHasCollision;
  }

  public static GetAllTilesetsOf(
    pathToTilemap: string,
    json: TiledJSON
  ): string[] {
    return TiledTilemap.LoadTilesets(pathToTilemap, json).map(tileset => tileset.imageUrlRelativeToGame);
  }

  private static LoadTilesets(pathToTilemap: string, json: TiledJSON): Tileset[] {
    const tilesets: Tileset[] = [];

    for (const { image: imageUrlRelativeToTilemap, name, firstgid, imageheight, imagewidth, tileheight, tilewidth } of json.tilesets) {
      const tiles = (imageheight * imagewidth) / (tileheight * tilewidth);
      const imageUrlRelativeToGame = 
        new URL(pathToTilemap + "/" + imageUrlRelativeToTilemap, "http://a").href.slice("http://a".length + 1); // slice off the initial / too

      tilesets.push({
        name,
        imageUrlRelativeToTilemap,
        imageUrlRelativeToGame,
        imagewidth,
        imageheight,
        tilewidth,
        tileheight,

        gidStart: firstgid,
        gidEnd  : firstgid + tiles,
      });
    }

    return tilesets;
  }

  private gidToTileset(gid: number): SpritesheetTile {
    for (const { gidStart, gidEnd, imageUrlRelativeToGame, imagewidth, tilewidth, tileheight } of this.tilesets) {
      if (gid >= gidStart && gid < gidEnd) {
        const normalizedGid = gid - gidStart;
        const tilesWide = imagewidth / tilewidth;

        const x = (normalizedGid % tilesWide);
        const y = Math.floor(normalizedGid / tilesWide);

        return {
          imageUrlRelativeToGame,
          spritesheetx: x,
          spritesheety: y,
          tilewidth,
          tileheight,
        };
      }
    }

    throw new Error("gid out of range. ask gabby what to do?!?");
  }

  private loadLayers(): { [layerName: string]: Grid<Tile> } {
    const result: { [layerName: string]: Grid<Tile> } = {};

    for (const layer of this.data.layers) {
      if (layer.type === "objectgroup") {
        this.loadObjects(layer);
      } else if (layer.type === "tilelayer") {
        const grid = this.loadTiles(layer);

        result[layer.name] = grid;
      }
    }

    return result;
  }

  private loadObjects(layer: TiledObjectLayerJSON): void {
    console.error("grant has not handled object group layers yet!!!");

    /*
    const objects: Entity<any, any>[] = [];
    for (const object of layer.objects) {
      const newObject = this.buildObject(object, this.game);
      if (!newObject) { continue; }
      newObject.set("x", object.x);
      newObject.set("y", object.y - 32);
      objects.push(newObject);
    }
    const result: ExternalLayerTypes["objects"] = {
      type   : "objects",
      objects,
    };
    (this.layers as any)[layer.name] = result;
    */
  }


  private loadTiles(layer: TiledTileLayerJSON): Grid<Tile> {
    const result = new Grid<Tile>();
    const { chunks, name: layername } = layer;

    // TODO: If the world gets very large, loading in all chunks like this might
    // not be the best idea - lazy loading could be better.

    for (const chunk of chunks) {
      for (let i = 0; i < chunk.data.length; i++) {
        const gid = chunk.data[i];

        if (gid === 0) { continue; } // empty
        if (gid > 200000) { continue; } // tiled bug? (TODO: does this actually happen?)

        const relTileX = (i % chunk.width);
        const relTileY = Math.floor(i / chunk.width);

        const absTileX = relTileX + chunk.x;
        const absTileY = relTileY + chunk.x;

        result.set(absTileX, absTileY, {
          x         : absTileX * this.data.tilewidth,
          y         : absTileY * this.data.tileheight,
          tile      : this.gidToTileset(gid),
          layername : layername,
          isCollider: this.gidHasCollision[gid] || false,
          gid       : gid,
        });
      }
    }

    return result;
  }

  public loadRegionLayers(region: Rect): {
    layerName: string;
    sprite: Sprite;
  }[] {
    const layers: {
      layerName: string;
      sprite: Sprite;
    }[] = [];

    for (const layerName of Object.keys(this.layers)) {
      const layer = this.layers[layerName];
      const renderTexture = RenderTexture.create({
        width : region.w,
        height: region.h,
      });
      const tileWidth  = this.data.tilewidth;
      const tileHeight = this.data.tileheight;

      for (let i = region.x / tileWidth; i < region.right / tileWidth; i++) {
        for (let j = region.y / tileHeight; j < region.bottom / tileHeight; j++) {
          const tile = layer.get(i, j);

          if (!tile) { continue; }

          const {
            x,
            y,
            tile: {
              imageUrlRelativeToGame,
              spritesheetx,
              spritesheety,
            },
          } = tile;

          const spriteTex = TextureCache.GetTextureFromSpritesheet({ 
            textureName: imageUrlRelativeToGame as ResourceName, // TODO: Is there any way to improve this cast?
            x          : spritesheetx, 
            y          : spritesheety, 
            tilewidth  : this.tileWidth, 
            tileheight : this.tileHeight 
          });

          // We have to offset here because we'd be drawing outside of the
          // bounds of the RenderTexture otherwise.

          spriteTex.x = x - region.x;
          spriteTex.y = y - region.y;

          this.renderer.render(spriteTex, renderTexture, false);
        }
      }

      layers.push({
        sprite   : new Sprite(renderTexture),
        layerName,
      })
    }

    return layers;
  }

  public getTilesAt(x: number, y: number): Tile[] {
    const tileWidth  = this.data.tilewidth;
    const tileHeight = this.data.tileheight;

    const tiles: Tile[] = [];

    for (const layerName of Object.keys(this.layers)) {
      const tile = this.layers[layerName].get(
        Math.floor(x / tileWidth),
        Math.floor(y / tileHeight)
      );

      if (tile !== null) {
        tiles.push(tile);
      }
    }

    return tiles;
  }
}
