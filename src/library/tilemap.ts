import { Sprite, Renderer, RenderTexture, Texture } from 'pixi.js'
import { Rect } from './rect'
import { TiledJSON, Tileset, Tile, SpritesheetTile, TiledObjectLayerJSON, TiledTileLayerJSON } from './tilemap_types';
import { TextureCache } from './texture_cache';
import { Entity } from './entity';
import { TextureEntity } from '../texture_entity';

export type MapLayer = {
  layerName: string;
  entity   : Entity;
}

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

type TilemapCustomObjectSingle = {
  type: "single";
  name: string;
  getInstanceType: (tex: Texture) => Entity;
};

type TilemapCustomObjectGroup = {
  type: "group";
  names: string[];
  getInstanceType: (tex: Texture) => Entity;
  getGroupInstanceType: () => Entity;
};

type TilemapCustomObjects = 
  | TilemapCustomObjectGroup
  | TilemapCustomObjectSingle

// TODO: Handle the weird new file format where tilesets link to ANOTHER json file

export class TiledTilemap {
  private data: TiledJSON;
  private tilesets: Tileset[];
  private tileLayers: { [tilesetName: string]: Grid<Tile> };
  private renderer: Renderer;
  private gidHasCollision: { [id: number]: boolean } = {};
  // private buildCustomObject: (obj: TiledObjectJSON, tile: Tile) => Entity | null;
  private customObjects: TilemapCustomObjects[];

  constructor({ json: data, renderer, pathToTilemap, customObjects }: { 
    // this is required to calculate the relative paths of the tileset images.
    json         : TiledJSON; 
    renderer     : Renderer; 
    pathToTilemap: string;
    customObjects: TilemapCustomObjects[];
  }) {
    this.customObjects = customObjects;
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

  private gidInfo(gid: number): {
    spritesheet   : SpritesheetTile;
    tileProperties: { [key: string]: unknown };
  } {
    for (const { gidStart, gidEnd, imageUrlRelativeToGame, imagewidth, tilewidth, tileheight, tiles } of this.tilesets) {
      if (gid >= gidStart && gid < gidEnd) {
        const normalizedGid = gid - gidStart;
        const tilesWide = imagewidth / tilewidth;

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

  private loadObjectLayers(): { entity: Entity, layerName: string }[] {
    let objectLayers: { entity: Entity, layerName: string }[] = [];

    for (const layer of this.data.layers) {
      if (layer.type === "objectgroup") {
        objectLayers.push({
          entity   : this.loadObjectLayer(layer),
          layerName: layer.name,
        });
      } 
    }

    return objectLayers;
  }

  private loadObjectLayer(layer: TiledObjectLayerJSON): Entity {
    const objectLayer = new TextureEntity({ name: "objectLayer" });

    type ObjectInGroup = {
      name : string;
      tile : Tile;
      gridX: number;
      gridY: number;
    };

    const objectsToGroup: ObjectInGroup[] = [];

    // Step 0: 
    // Add all single objects

    for (const obj of layer.objects) {
      if (!obj.gid) {
        console.error("object in object layer without gid! very bad?!?");

        continue;
      }

      const { spritesheet, tileProperties } = this.gidInfo(obj.gid);
      let newObj: Entity | null = null;
      const tile = {
        x             : obj.x,

        // tiled pivot point is (0, 1) so we need to subtract by tile height.
        y             : obj.y - spritesheet.tileheight,
        tile          : spritesheet,
        isCollider    : this.gidHasCollision[obj.gid] || false,
        gid           : obj.gid,
        tileProperties: tileProperties,
      };

      for (const customObject of this.customObjects) {
        const tileType = tileProperties.type;

        if (typeof tileType !== "string") {
          continue;
        }

        if (customObject.type === "single") {
          if (customObject.name === tileType) {
            const spriteTex = TextureCache.GetTextureForTile(tile); 

            newObj = customObject.getInstanceType(spriteTex);
          }
        } else if (customObject.type === "group") {
          // add to the list of grouped objects, which we will process later.

          if (customObject.names.includes(tileType)) {
            objectsToGroup.push({
              name: tileType,
              tile: tile,
              // TODO: We're making an assumption that the size of the objects
              // are all the same. I think this is safe tho?
              gridX: tile.x / obj.width,
              gridY: tile.y / obj.height,
            });
          }
        }
      }

      if (newObj) {
        newObj.x = tile.x;
        newObj.y = tile.y;

        objectLayer.addChild(newObj);
      }
    }

    // Find all groups and add them
    // Step 1: Load all objects into grid

    const grid = new Grid<{ obj: ObjectInGroup, grouped: boolean }>();

    for (const objectToGroup of objectsToGroup) {
      grid.set(objectToGroup.gridX, objectToGroup.gridY, {
        obj    : objectToGroup,
        grouped: false,
      });
    }

    // Step 2: BFS from each object to find all neighbors which are part of the
    // group.

    for (const obj of objectsToGroup) {
      const result = grid.get(obj.gridX, obj.gridY);

      if (!result) { throw new Error("Wat"); }

      const { grouped } = result;

      if (grouped) {
        continue;
      }

      // Step 2a: Find all names of objects in that group

      let customObject: TilemapCustomObjectGroup | null = null;

      for (const candidate of this.customObjects) {
        if (candidate.type === "group") {
          if (candidate.names.includes(obj.name)) {
            customObject = candidate;

            break;
          }
        }
      }

      if (customObject === null) {
        throw new Error("HUH!?!?");
      }

      // Step 2: Actually run BFS

      const group: ObjectInGroup[] = [obj];
      const groupEdge: ObjectInGroup[] = [obj];

      while (groupEdge.length > 0) {
        const current = groupEdge.pop()!;
        const dxdy = [
          [ 1,  0],
          [-1,  0],
          [ 0 , 1],
          [ 0 ,-1],
        ];

        for (const [dx, dy] of dxdy) {
          const result = grid.get(current.gridX + dx, current.gridY + dy);

          if (!result) { continue; }

          const { obj: neighbor, grouped } = result;

          if (grouped) { continue; }
          if (group.includes(neighbor)) { continue; }
          if (customObject.names.includes(neighbor.name)) {
            group.push(neighbor);
            groupEdge.push(neighbor);
          }
        }
      }

      // BFS complete; `group` contains entire group.

      // TODO move everything to (0, 0) in the group

      for (const obj of group) {
        grid.get(obj.gridX, obj.gridY)!.grouped = true;
      }

      // Find (x, y) of group

      let minTileX = Number.POSITIVE_INFINITY;
      let minTileY = Number.POSITIVE_INFINITY;

      for (const obj of group) {
        minTileX = Math.min(minTileX, obj.tile.x);
        minTileY = Math.min(minTileY, obj.tile.y);
      }

      const groupEntity = customObject.getGroupInstanceType();

      groupEntity.x = minTileX;
      groupEntity.y = minTileY;

      for (const obj of group) {
        const spriteTex = TextureCache.GetTextureForTile(obj.tile);
        const objEntity = customObject.getInstanceType(spriteTex);

        groupEntity.addChild(objEntity);

        objEntity.x = obj.tile.x - groupEntity.x;
        objEntity.y = obj.tile.y - groupEntity.y;
      }

      objectLayer.addChild(groupEntity);
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

        const { spritesheet, tileProperties } = this.gidInfo(gid);

        // TODO: Merge instance properties and tileset properties...

        result.set(absTileX, absTileY, {
          x             : absTileX * this.data.tilewidth,
          y             : absTileY * this.data.tileheight,
          tile          : spritesheet,
          isCollider    : this.gidHasCollision[gid] || false,
          tileProperties: tileProperties,
          gid           : gid,
        });
      }
    }

    return result;
  }

  public loadRegionLayers(region: Rect): MapLayer[] {
    let layers: MapLayer[] = [];

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
        entity   : new TextureEntity({ texture: renderTexture, name: "map layer" }),
        layerName,
      })
    }

    // Load object layers
    // TODO: only load objects in this region - not the entire layer!!!

    const objectLayers = this.loadObjectLayers();

    layers = [...layers, ...objectLayers];

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
