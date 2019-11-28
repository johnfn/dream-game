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
import { TrashBin } from "../entities/trash_bin";
import { DreamBlob } from "../entities/dream_blob";
import { OutdoorSign } from "../entities/outdoor_sign";

export const CustomMapObjects: TilemapCustomObjects[] = [
  {
    type: "group",

    names: ["downStair"],
    getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "downStair" }),
    getGroupInstanceType: () => new Trapdoor({stairType: "down"})
  },

  {
    type: "group",

    names: ["upStair1", "upStair2"],
    getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "upStair" }),
    getGroupInstanceType: () => new Trapdoor({stairType: "up"})
  },

  {
    type: "group",

    names: ["doorLeft", "doorRight"],
    getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "door" }),
    getGroupInstanceType: () => new Door()
  },

  {
    type: "group",

    names: ["lockedDoorLeft", "lockedDoorRight"],
    getInstanceType: (tex: Texture) => new TextureEntity({ texture: tex, name: "door" }),
    getGroupInstanceType: () => new LockedDoor()
  },

  {
    type: "single",

    name: "characterStart",
    getInstanceType: (tex: Texture) => new CharacterStart(),
  },
  
  {
    type: "single",

    name: "treasureChest",
    getInstanceType: (tex: Texture, props: { [key: string]: unknown }, layerName: string) => new TreasureChest(tex, props, layerName),
  },

  {
    type: "single",

    name: "light",
    getInstanceType: (tex: Texture, props: { [key: string]: unknown }) => new Light(tex, props),
  },

  {
    type: "single",

    name: "glass",
    getInstanceType: (tex: Texture) => new Glass(tex),
  },

  {
    type: "single",

    name: "sign",
    getInstanceType: (tex: Texture) => new Sign(tex),
  },

  {
    type: "single",

    name: "trashBin",
    getInstanceType: (tex: Texture) => new TrashBin(tex),
  },

  {
    type: "single",

    name: "outdoorSign",
    getInstanceType: (tex: Texture) => new OutdoorSign(tex),
  },

  {
    type: "single",

    name: "dreamBlob",
    getInstanceType: (tex: Texture) => new DreamBlob(tex),
  },

  {
    type     : "rect",
    layerName: "Camera Bounds",
    process  : () => {}, // handled in dream_map.ts
  },
];