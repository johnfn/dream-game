import { TilemapCustomObjects } from "../library/tilemap_objects";
import { Texture } from "pixi.js";
import { TextureEntity } from "../texture_entity";
import { Trapdoor } from "../library/trapdoor";
import { Door } from "../entities/door";
import { LockedDoor } from "../entities/locked_door";
import { CharacterStart } from "../entities/character_start";
import { TreasureChest } from "../entities/treasure_chest";
import { Light } from "../entities/light";
import { Glass } from "../entities/glass";
import { Sign } from "../entities/sign";
import { DreamBlob } from "../entities/dream_blob";

export const CustomMapObjects: TilemapCustomObjects[] = [
  {
    type: "group" as const,

    names: ["downStair"],
    getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "downStair" }),
    getGroupInstanceType: () => new Trapdoor({stairType: "down"})
  },

  {
    type: "group" as const,

    names: ["upStair1", "upStair2"],
    getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "upStair" }),
    getGroupInstanceType: () => new Trapdoor({stairType: "up"})
  },

  {
    type: "group" as const,

    names: ["doorLeft", "doorRight"],
    getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "door" }),
    getGroupInstanceType: () => new Door()
  },

  {
    type: "group" as const,

    names: ["lockedDoorLeft", "lockedDoorRight"],
    getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "door" }),
    getGroupInstanceType: () => new LockedDoor()
  },

  {
    type: "single" as const,

    name: "characterStart",
    getInstanceType: (tex: Texture) => new CharacterStart(),
  },
  
  {
    type: "single" as const,

    name: "treasureChest",
    getInstanceType: (tex: Texture, props: { [key: string]: unknown }) => new TreasureChest(tex, props),
  },

  {
    type: "single" as const,

    name: "light",
    getInstanceType: (tex: Texture, props: { [key: string]: unknown }) => new Light(tex, props),
  },

  {
    type: "single" as const,

    name: "glass",
    getInstanceType: (tex: Texture) => new Glass(tex),
  },

  {
    type: "single" as const,

    name: "sign",
    getInstanceType: (tex: Texture) => new Sign(tex),
  },

  {
    type: "single" as const,

    name: "dreamBlob",
    getInstanceType: (tex: Texture) => new DreamBlob(tex),
  },

  {
    type     : "rect" as const,
    layerName: "Camera Bounds",
    process  : () => {}, // handled in dream_map.ts
  },
];