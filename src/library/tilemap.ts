import { Sprite, Renderer, RenderTexture } from 'pixi.js'
import { Rect } from './rect'
import { TiledJSON, Tileset, Tile, SpritesheetTile, TiledObjectLayerJSON, TiledTileLayerJSON, TiledLayerTypes } from './tilemap_types';
import { TextureCache } from './texture_cache';
import { Entity } from './entity';
import { TextureEntity } from '../texture_entity';
import { Grid } from './grid';
import { TiledTilemapObjects, TilemapCustomObjects } from './tilemap_objects'

export type MapLayer = {
  layerName: string;
  entity   : Entity;
};

// TODO: Handle the weird new file format where tilesets link to ANOTHER json file

export class TiledTilemap {
  private _tileWidth: number;
  private _tileHeight: number;
  private _data: TiledJSON;
  private _tilesets: Tileset[];
  private _tileLayers: { [tilesetName: string]: Grid<Tile> };
  private _renderer: Renderer;
  private _objects: TiledTilemapObjects;

  // (should be private, but cant be for organization reasons)
  _gidHasCollision: { [id: number]: boolean } = {};

  constructor({ json: data, renderer, pathToTilemap, customObjects }: { 
    // this is required to calculate the relative paths of the tileset images.
    json         : TiledJSON; 
    renderer     : Renderer; 
    pathToTilemap: string;
    customObjects: TilemapCustomObjects[];
  }) {
    this._data          = data;
    this._renderer      = renderer;
    this._tileWidth     = this._data.tilewidth;
    this._tileHeight    = this._data.tileheight;
    this._tilesets        = TiledTilemap.LoadTilesets(pathToTilemap, this._data);
    this._gidHasCollision = this.buildCollisionInfoForTiles()
    this._tileLayers      = this.loadTileLayers();

    this._objects       = new TiledTilemapObjects({
      layers       : this.getAllObjectLayers(),
      customObjects: customObjects,
      map          : this,
    });
  }

  /**
   * Load all the regions on a specified layer.
   */
  loadRegionLayer(layerName: string): Rect[] {
    const layers = this.getAllLayers(this._data.layers);

    const layer = layers.find(layer => layer.name = layerName);

    if (!layer) {
      throw new Error(`Cant find a layer named ${ layerName }`);
    }

    if (layer.type !== "objectgroup") {
      throw new Error(`Layer ${ layerName } is not an object group as I expected!`);
    }

    const objects = layer.objects;
    const result: Rect[] = [];

    for (const obj of objects) {
      if (!obj.gid) {
        result.push(new Rect({
          x: obj.x,
          y: obj.y,
          w: obj.width,
          h: obj.height,
        }));
      }
    }

    return result; 
  }

  private buildCollisionInfoForTiles(): { [key: number]: boolean } {
    // Build a dumb (for now) object of collision ids by just checking if the
    // tile literally has any collision object at all and takes that to mean the
    // entire thing is covered.

    // We could improve this if we want!

    const gidHasCollision: { [id: number]: boolean } = {};

    for (const tileset of this._data.tilesets) {
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

    for (const { image: imageUrlRelativeToTilemap, name, firstgid, imageheight, imagewidth, tileheight, tilewidth, tiles } of json.tilesets) {
      const tileCountInTileset = (imageheight * imagewidth) / (tileheight * tilewidth);
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
        tiles,

        gidStart: firstgid,
        gidEnd  : firstgid + tileCountInTileset,
      });
    }

    return tilesets;
  }

  gidInfo(gid: number): {
    spritesheet   : SpritesheetTile;
    tileProperties: { [key: string]: unknown };
  } {
    for (const { gidStart, gidEnd, imageUrlRelativeToGame, imagewidth, tilewidth, tileheight, tiles } of this._tilesets) {
      if (gid >= gidStart && gid < gidEnd) {
        const normalizedGid = gid - gidStart;
        const tilesWide     = imagewidth / tilewidth;

        const x = (normalizedGid % tilesWide);
        const y = Math.floor(normalizedGid / tilesWide);

        const spritesheet = {
          imageUrlRelativeToGame,
          spritesheetx: x,
          spritesheety: y,
          tilewidth,
          tileheight,
          tileProperties: tiles,
        };

        let tileProperties: { [key: string]: unknown } = {};

        if (tiles) {
          const matchedTileInfo = tiles.find(tile => gid === gidStart + tile.id);

          if (matchedTileInfo && matchedTileInfo.properties) {
            for (const { name, value } of matchedTileInfo.properties) {
              tileProperties[name] = value;
            }
          }
        }

        return {
          spritesheet,
          tileProperties,
        };
      }
    }

    throw new Error("gid out of range. ask gabby what to do?!?");
  }

  /**
   * Returns all layers as a flat array - most notably flattens
   * layer groups, which are nested.
   */
  private getAllLayers(root: TiledLayerTypes[]): (TiledTileLayerJSON | TiledObjectLayerJSON)[] {
    let result: (TiledTileLayerJSON | TiledObjectLayerJSON)[] = [];

    for (const layer of root) {
      if (layer.type === "group") {
        result = [...result, ...this.getAllLayers(layer.layers)];
      } else {
        result.push(layer);
      }
    }

    return result;
  }

  private getAllObjectLayers(): TiledObjectLayerJSON[] {
    const allLayers = this.getAllLayers(this._data.layers);
    const objectLayers: TiledObjectLayerJSON[] = [];

    for (const layer of allLayers) {
      if (layer.type === "objectgroup") {
        objectLayers.push(layer);
      }
    }

    return objectLayers;
  }

  private loadTileLayers(): { [layerName: string]: Grid<Tile> } {
    const result: { [layerName: string]: Grid<Tile> } = {};
    const layers = this.getAllLayers(this._data.layers);

    for (const layer of layers) {
      if (layer.type === "tilelayer") {
        const grid = this.loadTiles(layer);

        result[layer.name] = grid;
      }
    }

    return result;
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

        const { spritesheet, tileProperties } = this.gidInfo(gid);

        // TODO: Merge instance properties and tileset properties...

        result.set(absTileX, absTileY, {
          x             : absTileX * this._data.tilewidth,
          y             : absTileY * this._data.tileheight,
          tile          : spritesheet,
          isCollider    : this._gidHasCollision[gid] || false,
          tileProperties: tileProperties,
          gid           : gid,
        });
      }
    }

    return result;
  }

  public loadRegion(region: Rect): MapLayer[] {
    let layers: MapLayer[] = [];

    // Load tile layers

    for (const layerName of Object.keys(this._tileLayers)) {
      const layer = this._tileLayers[layerName];
      const renderTexture = RenderTexture.create({
        width : region.w,
        height: region.h,
      });
      const tileWidth  = this._data.tilewidth;
      const tileHeight = this._data.tileheight;

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

          this._renderer.render(sprite, renderTexture, false);
        }
      }

      const layerEntity = new TextureEntity({ texture: renderTexture, name: "map layer" });

      layerEntity.x = region.x;
      layerEntity.y = region.y;

      layers.push({
        entity   : layerEntity,
        layerName,
      })
    }

    // Load object layers
    // TODO: only load objects in this region - not the entire layer!!!

    const objectLayers = this._objects.loadObjectLayers()

    layers = [...layers, ...objectLayers];

    return layers;
  }

  public getTilesAtAbs(x: number, y: number): Tile[] {
    const tileWidth  = this._data.tilewidth;
    const tileHeight = this._data.tileheight;

    const tiles: Tile[] = [];

    for (const layerName of Object.keys(this._tileLayers)) {
      const tile = this._tileLayers[layerName].get(
        Math.floor(x / tileWidth),
        Math.floor(y / tileHeight)
      );

      if (tile !== null) {
        tiles.push(tile);
      }
    }

    return tiles;
  }

  getCollidersInRegion(region: Rect): Rect[] {
    const lowX = Math.floor(region.x / this._tileWidth);
    const lowY = Math.floor(region.y / this._tileHeight);

    const highX = Math.ceil(region.right  / this._tileWidth);
    const highY = Math.ceil(region.bottom / this._tileHeight);

    const colliders: Rect[] = [];

    for (let x = lowX; x <= highX; x++) {

      outer:
      for (let y = lowY; y <= highY; y++) {
        const tiles = this.getTilesAtAbs(x * this._tileWidth, y * this._tileHeight);
        
        for (const tile of tiles) {
          if (tile.isCollider) {
            colliders.push(new Rect({
              x: x * this._tileWidth,
              y: y * this._tileHeight,
              w: this._tileWidth,
              h: this._tileHeight,
            }));

            continue outer;
          }
        }
      }
    }

    return colliders;
  }
  
  turnOffAllObjects() {
    this._objects.turnOffAllObjects();
  }
}
