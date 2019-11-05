import { Loader, LoaderResource } from 'pixi.js'
import { ResourceName } from '../resources';

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

    for (const resourcePath of Object.keys(resourceNames)) {
      this.loader.add(resourcePath)
    }

    this.loader.load(this.finishLoading)
  }

  getResource<T extends ResourceName>(resourceName: T): LoaderResource {
    if (!this.loadComplete) {
      throw new Error("You're trying to get a resource before the loader has finished loading.");
    }

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