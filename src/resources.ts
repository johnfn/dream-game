// Put all resources the game uses in this file and we'll preload them before
// the game starts.

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