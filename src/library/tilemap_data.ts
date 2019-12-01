import { TiledJSON, Tileset, Tile, TiledLayerTypes, TiledTileLayerJSON, TiledObjectLayerJSON, SpritesheetTile, TiledObject } from "./tilemap_types";
import { Grid } from "./grid";
import { Rect } from "./rect";
import { RectGroup } from "./rect_group";

export type TilemapLayer = 
  {
    type: "tiles";
    grid: Grid<Tile>;
  } | {
    type : "rects";
    rects: Rect[];
  }

export class TilemapData {
  private _data      : TiledJSON;
  private _tileWidth : number;
  private _tileHeight: number;
  private _layers: { [tilesetName: string]: TilemapLayer };
  private _tilesets  : Tileset[];

  // (should be private, but cant be for organization reasons)
  _gidHasCollision: { [id: number]: boolean } = {};

  constructor(props: { 
    data         : TiledJSON;
    pathToTilemap: string;
  }) {
    const { data, pathToTilemap } = props;

    this._data = data;
    this._tileWidth       = this._data.tilewidth;
    this._tileHeight      = this._data.tileheight;
    this._gidHasCollision = this.buildCollisionInfoForTiles()
    this._tilesets        = this.loadTilesets(pathToTilemap, this._data);
    this._layers          = this.loadTileLayers();
  }

  isGidCollider(gid: number): boolean {
    return this._gidHasCollision[gid] || false;
  }

  getTileWidth(): number {
    return this._tileWidth;
  }

  getTileHeight(): number {
    return this._tileHeight;
  }

  getTilesets(): Tileset[] {
    return this._tilesets;
  }

  private loadTilesets(pathToTilemap: string, json: TiledJSON): Tileset[] {
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

  getLayerNames(): string[] {
    return Object.keys(this._layers);
  }

  private getAllLayers(): (TiledTileLayerJSON | TiledObjectLayerJSON)[] {
    return this._getAllLayersHelper(this._data.layers);
  }

  getLayer(layerName: string) {
    return this._layers[layerName];
  }

  /**
   * Returns all layers as a flat array - most notably flattens
   * layer groups, which are nested.
   */
  private _getAllLayersHelper(root: TiledLayerTypes[]): (TiledTileLayerJSON | TiledObjectLayerJSON)[] {
    let result: (TiledTileLayerJSON | TiledObjectLayerJSON)[] = [];

    for (const layer of root) {
      if (layer.type === "group") {
        result = [...result, ...this._getAllLayersHelper(layer.layers)];
      } else {
        result.push(layer);
      }
    }

    return result;
  }

  getAllObjectLayers(): TiledObjectLayerJSON[] {
    const allLayers = this.getAllLayers();
    const objectLayers: TiledObjectLayerJSON[] = [];

    for (const layer of allLayers) {
      if (layer.type === "objectgroup") {
        objectLayers.push(layer);
      }
    }

    return objectLayers;
  }

  private loadTileLayers(): { [layerName: string]: TilemapLayer } {
    const result: { [layerName: string]: TilemapLayer } = {};
    const layers = this.getAllLayers();

    for (const layer of layers) {
      if (layer.type === "tilelayer") {
        const grid = this.loadTiles(layer);

        result[layer.name] = { 
          type: "tiles",
          grid,
        };
      } else if (layer.type === "objectgroup") {
        result[layer.name] = this.loadRectLayer(layer);
      }
    }

    return result;
  }

  loadRectLayer(layer: TiledObjectLayerJSON): TilemapLayer {
    const objects = layer.objects;
    const rects: Rect[] = [];

    for (const obj of objects) {
      if (!obj.gid) {
        rects.push(new Rect({
          x: obj.x,
          y: obj.y,
          w: obj.width,
          h: obj.height,
        }));
      }
    }

    return {
      type : "rects",
      rects: rects,
    };
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
        if (gid > 200000) { throw new Error("???"); } // tiled bug? (TODO: does this actually happen?)

        const relTileX = (i % chunk.width);
        const relTileY = Math.floor(i / chunk.width);

        const absTileX = relTileX + chunk.x;
        const absTileY = relTileY + chunk.y;

        const { spritesheet, tileProperties } = this.gidInfo(gid);

        // TODO: Merge instance properties and tileset properties...

        result.set(absTileX, absTileY, {
          x             : absTileX * this._tileWidth,
          y             : absTileY * this._tileHeight,
          tile          : spritesheet,
          isCollider    : this.isGidCollider(gid),
          tileProperties: tileProperties,
          gid           : gid,
        });
      }
    }

    return result;
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

  public getTilesAtAbsolutePosition(x: number, y: number): Tile[] {
    return this.getLayerNames()
      .map(layerName => this.getTileAtAbsolutePositionForLayer(x, y, layerName))
      .filter(x => x) as Tile[];
  }

  public getTileAtAbsolutePositionForLayer(x: number, y: number, layerName: string): Tile | null {
    const tileWidth  = this._tileWidth;
    const tileHeight = this._tileHeight;

    const layer = this._layers[layerName];

    if (layer.type === "tiles") {
      return layer.grid.get(
        Math.floor(x / tileWidth),
        Math.floor(y / tileHeight)
      );
    }

    return null;
  }

  getCollidersInRegion(region: Rect): Rect[] {
    return this.getLayerNames()
      .map(layerName => this.getCollidersInRegionForLayer(region, layerName))
      .flat();
  }

  getCollidersInRegionForLayer(region: Rect, layerName: string): RectGroup {
    const lowX = Math.floor(region.x / this._tileWidth);
    const lowY = Math.floor(region.y / this._tileHeight);

    const highX = Math.ceil(region.right  / this._tileWidth);
    const highY = Math.ceil(region.bottom / this._tileHeight);

    const colliders: Rect[] = [];

    for (let x = lowX; x <= highX; x++) {
      for (let y = lowY; y <= highY; y++) {
        const tile = this.getTileAtAbsolutePositionForLayer(
          x * this._tileWidth, 
          y * this._tileHeight,
          layerName
        );
        
        if (tile && tile.isCollider) {
          colliders.push(new Rect({
            x: x * this._tileWidth,
            y: y * this._tileHeight,
            w: this._tileWidth,
            h: this._tileHeight,
          }));
        }
      }
    }

    return new RectGroup(colliders);
  }
  
}