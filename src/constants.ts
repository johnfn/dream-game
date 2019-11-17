import {
  Renderer,
  Filter,
  Container,
  Sprite,
  WRAP_MODES
} from "pixi.js";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";

const displacementSprite: Sprite = Sprite.from(
  "https://res.cloudinary.com/dvxikybyi/image/upload/v1486634113/2yYayZk_vqsyzx.png"
);
displacementSprite.texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;

export class C {
  public static CANVAS_WIDTH = 640;
  public static CANVAS_HEIGHT = 640;

  public static TILE_WIDTH = 64;
  public static TILE_HEIGHT = 64;

  public static INTERACTION_DISTANCE = 100;

  public static Renderer: Renderer;
  public static Loader: TypesafeLoader<typeof ResourcesToLoad>;
  public static Stage: Container;

  public static DreamFilters: Filter[] = [
  ];
}
