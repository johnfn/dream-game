// Put all resources the game uses in this file and we'll preload them before
// the game starts.

// TODO: It would be nice for the keys of this object to somehow indicate what
// the type was, so later when you do getResource() you get something more
// targetted than a generic blob of data.

export enum ResourceType {
  Image,
  Tileset,
}

export const ResourcesToLoad = {
  "logo192.png"   : ResourceType.Image,
  "art/tileset"   : ResourceType.Image,
  "maps/map.json" : ResourceType.Tileset,
};

export type ResourceName = keyof typeof ResourcesToLoad;