import { Sprite, Renderer, RenderTexture } from 'pixi.js'
import { Rect } from './rect'
import { TiledJSON } from './tilemap_types';
import { TextureCache } from './texture_cache';
import { Entity } from './entity';
import { TextureEntity } from '../texture_entity';
import { TiledTilemapObjects, TilemapCustomObjects, ObjectInfo } from './tilemap_objects'
import { C } from '../constants';
import { TilemapData } from './tilemap_data';

export type MapLayer = {
  layerName  : string;
  entity     : Entity;
  objectLayer: boolean;
};

// TODO: Handle the weird new file format where tilesets link to ANOTHER json file

export class TiledTilemap {
  private _tileWidth  : number;
  private _tileHeight : number;
  private _renderer   : Renderer;
  private _objects    : TiledTilemapObjects;

  _data : TilemapData;

  constructor({ json: data, renderer, pathToTilemap, customObjects }: { 
    // this is required to calculate the relative paths of the tileset images.
    json         : TiledJSON; 
    renderer     : Renderer; 
    pathToTilemap: string;
    customObjects: TilemapCustomObjects[];
  }) {
    this._data       = new TilemapData({ data, pathToTilemap });
    this._renderer   = renderer;
    this._tileWidth  = this._data.getTileWidth();
    this._tileHeight = this._data.getTileHeight();

    this._objects    = new TiledTilemapObjects({
      layers       : this._data.getAllObjectLayers(),
      customObjects: customObjects,
      map          : this,
    });
  }

  /**
   * Load all the regions on a specified layer.
   */
  loadRegionLayer(layerName: string): Rect[] {
    const layer = this._data.getLayer(layerName);

    if (layer.type === "rects") {
      return layer.rects;
    }

    throw new Error("Not a rect layer");
  }

  public loadRegion(region: Rect): MapLayer[] {
    let tileLayers: MapLayer[] = [];

    // Load tile layers

    for (const layerName of this._data.getLayerNames()) {
      const layer = this._data.getLayer(layerName);
      if (layer.type !== "tiles") { continue; }

      const renderTexture = RenderTexture.create({
        width : region.w,
        height: region.h,
      });
      const tileWidth  = this._tileWidth;
      const tileHeight = this._tileHeight;

      for (let i = region.x / tileWidth; i < region.right / tileWidth; i++) {
        for (let j = region.y / tileHeight; j < region.bottom / tileHeight; j++) {
          const tile = layer.grid.get(i, j);

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

      const layerEntity = new TextureEntity({ 
        texture: renderTexture, 
        name   : layerName,
      });

      layerEntity.x = region.x;
      layerEntity.y = region.y;

      tileLayers.push({
        entity     : layerEntity,
        layerName  ,
        objectLayer: false,
      });
    }

    // Load object layers
    // TODO: only load objects in this region - not the entire layer!!!

    const objectLayers = this._objects.loadObjectLayers();

    for (const objectLayer of objectLayers) {
      objectLayer.entity.zIndex = C.Depths.ObjectLayerDepth;
    }

    for (const tileLayer of tileLayers) {
      tileLayer.entity.zIndex = C.Depths.TileLayerDepth;
    }

    tileLayers = [...tileLayers, ...objectLayers];

    return tileLayers;
  }

  turnOffAllObjects() {
    this._objects.turnOffAllObjects();
  }

  getAllObjects(): ObjectInfo[] {
    return this._objects.getAllObjects();
  }
}
