// Put all resources the game uses in this file and we'll preload them before
// the game starts.

// TODO: It would be nice for the keys of this object to somehow indicate what
// the type was, so later when you do getResource() you get something more
// targeted than a generic blob of data.

export enum ResourceType {
  Image,
  Tileset,
  Spritesheet,
}

export const ResourcesToLoad = {
  "logo192.png"              : ResourceType.Image,
  "art/tileset"              : ResourceType.Image,
  "art/temp.png"             : ResourceType.Image,
  "art/char.png"             : ResourceType.Image,
  "art/char_spritesheet.json": ResourceType.Spritesheet,
  "maps/map.json"            : ResourceType.Tileset,
};

export type ResourceName = keyof typeof ResourcesToLoad;