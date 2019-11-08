import { Loader, LoaderResource } from 'pixi.js'
import { ResourceName, ResourcesToLoad, ResourceType } from '../resources';
import { TiledTilemap } from './tilemap';

/** 
 * TypeSafe loader is intended to be a wrapper around PIXI.Loader which gives a
 * type-checked getResource() check.
 */
export class TypesafeLoader<Resources> {
  loader: Loader;
  loadComplete: boolean;
  loadCompleteCallbacks: (() => void)[];

  constructor(resourceNames: Resources) {
    this.loadCompleteCallbacks = [];
    this.loader = new Loader();
    this.loadComplete = false;

    this.startStageOneLoading(resourceNames);
  }

  // Stage 1: Load all assets in resources.ts
  private startStageOneLoading = (resourceNames: Resources) => {
    for (const resourcePath of Object.keys(resourceNames)) {
      this.loader.add(resourcePath);
    }

    this.loader.load(this.startStageTwoLoading);
  }

  // Stage 2: Load all assets required by tilemaps - mostly tilesets, I hope!.
  private startStageTwoLoading = () => {
    let allTilemapDependencyPaths: string[] = [];

    for (const resource of Object.keys(ResourcesToLoad)) {
      const castedResource = resource as keyof typeof ResourcesToLoad;
      const pathToTilemap = resource.substring(0, resource.lastIndexOf("/"))

      if (ResourcesToLoad[castedResource] === ResourceType.Tileset) {
        allTilemapDependencyPaths = allTilemapDependencyPaths.concat(
          TiledTilemap.GetAllTilesetsOf(pathToTilemap, this.getResource(castedResource).data)
        );
      }
    }

    for (const tilemapDependencyPath of allTilemapDependencyPaths) {
      this.loader.add(tilemapDependencyPath);
    }

    this.loader.load(this.finishLoading);
  }

  getResource<T extends ResourceName>(resourceName: T): LoaderResource {
    return this.loader.resources[resourceName as any];
  }

  private finishLoading = () => {
    this.loadComplete = true;

    for (const callback of this.loadCompleteCallbacks) {
      callback();
    }

    this.loadCompleteCallbacks = [];
  }

  onLoadComplete(callback: () => void) {
    if (this.loadComplete) {
      callback();
    } else {
      this.loadCompleteCallbacks.push(callback);
    }
  }
}