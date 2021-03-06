// Put all resources the game uses in this file and we'll preload them before
// the game starts.

export enum ResourceType {
  Image,
  Tileset,
  Spritesheet,
}

export const ResourcesToLoad = {
  "logo192.png"                    : ResourceType.Image,
  "art/tileset"                    : ResourceType.Image,
  "art/temp.png"                   : ResourceType.Image,
  "art/key.png"                    : ResourceType.Image,
  "art/char.png"                   : ResourceType.Image,
  "art/char_spritesheet.png"      : ResourceType.Spritesheet,
  "art/dialog_box.png"             : ResourceType.Image,
  "maps/map.json"                  : ResourceType.Tileset,

  "art/portrait_door.png"          : ResourceType.Image,
  "art/portrait_door_angry.png"    : ResourceType.Image,
  "art/portrait_sign.png"          : ResourceType.Image,
  "art/portrait_trashcan.png"      : ResourceType.Image,
  "art/portrait_treasurechest.png" : ResourceType.Image,
  "art/portrait_you.png"           : ResourceType.Image,
};

export type ResourceName = keyof typeof ResourcesToLoad;