import { Sprite, Renderer, RenderTexture, Texture } from 'pixi.js'
import { Rect } from './rect'
import { TiledJSON, Tileset, Tile, SpritesheetTile, TiledObjectLayerJSON, TiledTileLayerJSON, TiledObjectJSON } from './tilemap_types';
import { TextureCache } from './texture_cache';
import { Entity } from './entity';
import { TestEntity } from '../test_entity';

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
  private tilesets: Tileset[];
  private tileLayers: { [tilesetName: string]: Grid<Tile> };
  private renderer: Renderer;
  private gidHasCollision: { [id: number]: boolean } = {};
  private buildCustomObject: (obj: TiledObjectJSON, tile: Tile) => Entity | null;

  constructor({ json: data, renderer, pathToTilemap, buildCustomObject }: { 
    // this is required to calculate the relative paths of the tileset images.
    json             : TiledJSON; 
    renderer         : Renderer; 
    pathToTilemap    : string;
    buildCustomObject: (obj: TiledObjectJSON, tile: Tile) => Entity | null;
  }) {
    this.buildCustomObject = buildCustomObject;
    this.data = data;
    this.renderer = renderer;

    this.tilesets = TiledTilemap.LoadTilesets(pathToTilemap, this.data);
    this.gidHasCollision = this.buildCollisionInfoForTiles()
    this.tileLayers = this.loadTileLayers();
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
          if (!tileAndCollisionObjects.objectgroup) {
            continue;
          }

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

  private loadTileLayers(): { [layerName: string]: Grid<Tile> } {
    const result: { [layerName: string]: Grid<Tile> } = {};

    for (const layer of this.data.layers) {
      if (layer.type === "tilelayer") {
        const grid = this.loadTiles(layer);

        result[layer.name] = grid;
      }
    }

    return result;
  }

  private loadObjectLayers(): Entity {
    let result: Entity | null = null;

    for (const layer of this.data.layers) {
      if (layer.type === "objectgroup") {
        result = this.loadObjectLayer(layer);
      } 
    }

    if (result === null) {
      throw new Error("Handle this case!");
    }

    // TODO Handle case of multiple object layers

    return result;
  }

  private loadObjectLayer(layer: TiledObjectLayerJSON): Entity {
    const objectLayer = new TestEntity(Texture.EMPTY);

    for (const obj of layer.objects) {
      if (obj.gid) {
        const spritesheetTile = this.gidToTileset(obj.gid);

        const newObj = this.buildCustomObject(obj, {
          x         : obj.x,
          y         : obj.y,
          tile      : spritesheetTile,
          isCollider: this.gidHasCollision[obj.gid] || false,
          gid       : obj.gid,
        });

        if (newObj) {
          objectLayer.addChild(newObj);
        }
      } else {
        console.error("object in object layer without gid! very bad?!?");
      }
    }

    return objectLayer;
  }

  private loadTiles(layer: TiledTileLayerJSON): Grid<Tile> {
    const result = new Grid<Tile>();
    const { chunks } = layer;

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
        const absTileY = relTileY + chunk.y;

        result.set(absTileX, absTileY, {
          x         : absTileX * this.data.tilewidth,
          y         : absTileY * this.data.tileheight,
          tile      : this.gidToTileset(gid),
          isCollider: this.gidHasCollision[gid] || false,
          gid       : gid,
        });
      }
    }

    return result;
  }

  public loadRegionLayers(region: Rect): {
    layerName: string;
    entity   : Entity;
  }[] {
    const layers: {
      layerName: string;
      entity   : Entity;
    }[] = [];

    // Load tile layers

    for (const layerName of Object.keys(this.tileLayers)) {
      const layer = this.tileLayers[layerName];
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

          const tex = TextureCache.GetTextureForTile(tile);
          const sprite = new Sprite(tex);

          // We have to offset here because we'd be drawing outside of the
          // bounds of the RenderTexture otherwise.

          sprite.x = tile.x - region.x;
          sprite.y = tile.y - region.y;

          this.renderer.render(sprite, renderTexture, false);
        }
      }

      layers.push({
        entity   : new TestEntity(renderTexture),
        layerName,
      })
    }

    // Load object layers

    // TODO: Load multiple object layers
    // TODO: only load objects in this region

    const objectLayer = this.loadObjectLayers();

    layers.push({
      entity: objectLayer,
      layerName: "Object Layer TODO",
    });

    return layers;
  }

  public getTilesAt(x: number, y: number): Tile[] {
    const tileWidth  = this.data.tilewidth;
    const tileHeight = this.data.tileheight;

    const tiles: Tile[] = [];

    for (const layerName of Object.keys(this.tileLayers)) {
      const tile = this.tileLayers[layerName].get(
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
