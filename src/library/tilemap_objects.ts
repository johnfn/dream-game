import { Entity } from "./entity";
import { Rect } from "./rect";
import { TiledObjectLayerJSON, Tile } from "./tilemap_types";
import { TextureCache } from "./texture_cache";
import { Grid } from "./grid";
import { Texture } from "pixi.js";
import { TiledTilemap, MapLayer } from "./tilemap";
import { TextureEntity } from "../texture_entity";
import { CustomMapObjects } from "../map/custom_map_objects";

type TilemapCustomObjectSingle = {
  type            : "single";
  name            : string;
  getInstanceType : (tex: Texture, tileProperties: { [key: string]: unknown }, layerName: string) => Entity;
};

type TilemapCustomObjectGroup = {
  type                 : "group";
  names                : string[];
  getInstanceType      : (tex: Texture) => Entity;
  getGroupInstanceType : () => Entity;
};

type TilemapCustomObjectRect = {
  type     : "rect";
  layerName: string;
  process  : (rect: Rect) => void;
};

export type TilemapCustomObjects = 
  | TilemapCustomObjectGroup
  | TilemapCustomObjectSingle
  | TilemapCustomObjectRect

export type ObjectInfo = { entity: Entity; layerName: string };

export class TiledTilemapObjects {
  private _layers: TiledObjectLayerJSON[];
  private _customObjects: TilemapCustomObjects[];
  private _map: TiledTilemap;

  /**
   * Every custom object in the game.
   */
  private _allObjects: ObjectInfo[] = [];

  constructor(props: {
    layers       : TiledObjectLayerJSON[];
    customObjects: TilemapCustomObjects[];
    map          : TiledTilemap;
  }) {
    const { layers, customObjects, map } = props;

    this._layers        = layers;
    this._customObjects = customObjects;
    this._map           = map;

    for (const layer of this._layers) {
      const objectsInLayer = this.loadLayer(layer);

      this._allObjects = [...this._allObjects, ...objectsInLayer];
    }

    this.turnOffAllObjects();
  }

  turnOffAllObjects() {
    for (const customObject of this._allObjects) {
      customObject.entity.stopUpdating();
    }
  }

  loadObjectLayers(): MapLayer[] {
    this.turnOffAllObjects();

    let result: MapLayer[] = [];

    for (const layer of this._layers) {
      result.push({
        entity     : new TextureEntity({ name: layer.name }),
        layerName  : layer.name,
        objectLayer: true,
      });
    }

    for (const object of this._allObjects) {
      const associatedLayer = result.find(obj => obj.layerName === object.layerName)!;

      associatedLayer.entity.addChild(object.entity);
      object.entity.startUpdating();
    }

    return result;
  }

  private loadLayer(layer: TiledObjectLayerJSON): ObjectInfo[] {
    const results: ObjectInfo[] = [];

    type ObjectInGroup = {
      name : string;
      tile : Tile;
      gridX: number;
      gridY: number;
    };

    const objectsToGroup: ObjectInGroup[] = [];

    // Step 0: 
    // Add all single objects

    processNextObject:
    for (const obj of layer.objects) {
      if (!obj.gid) {
        // this is probably a region, so see if we have one of those.

        for (const customObject of this._customObjects) {
          if (customObject.type === "rect" && customObject.layerName === layer.name) {
            customObject.process(
              new Rect({
                x: obj.x,
                y: obj.y,
                w: obj.width,
                h: obj.height,
              })
            );

            continue processNextObject;
          }
        }

        throw new Error(`on layer ${ layer.name } you probably have a rect region that's not being processed in dream_map`);
      }

      const { spritesheet, tileProperties } = this._map.gidInfo(obj.gid);
      const objProperties: { [key: string]: unknown } = {};

      for (const { name, value } of (obj.properties || [])) {
        tileProperties[name] = value;
      }

      const allProperties = {
        ...tileProperties,
        ...objProperties,
      };

      let newObj: Entity | null = null;
      const tile = {
        x             : obj.x,

        // tiled pivot point is (0, 1) so we need to subtract by tile height.
        y             : obj.y - spritesheet.tileheight,
        tile          : spritesheet,
        isCollider    : this._map._gidHasCollision[obj.gid] || false,
        gid           : obj.gid,
        tileProperties: allProperties,
      };

      const tileType = allProperties.type as string;

      if (tileType === undefined) {
        throw new Error("Custom object needs a tile type");
      }

      const associatedObject = this._customObjects.find(obj => {
        if (obj.type === "single") {
          return obj.name === tileType;
        }

        if (obj.type === "group") {
          return obj.names.includes(tileType);
        }

        return false;
      });

      if (associatedObject === undefined) {
        throw new Error(`Unhandled tile type: ${ tileType }`);
      }

      if (associatedObject.type === "single") {
        if (associatedObject.name === tileType) {
          const spriteTex = TextureCache.GetTextureForTile(tile); 

          newObj = associatedObject.getInstanceType(spriteTex, allProperties, layer.name);
        }
      } else if (associatedObject.type === "group") {
        // add to the list of grouped objects, which we will process later.

        if (associatedObject.names.includes(tileType)) {
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

      if (newObj) {
        newObj.x = tile.x;
        newObj.y = tile.y;

        results.push({
          entity   : newObj,
          layerName: layer.name,
        });
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

      for (const candidate of this._customObjects) {
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

      results.push({
        entity   : groupEntity,
        layerName: layer.name,
      });
    }

    return results;
  }

  getAllObjects(): ObjectInfo[] {
    return this._allObjects;
  }
}