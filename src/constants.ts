import {
  Renderer,
  Filter,
  filters,
  Container,
  Sprite,
  WRAP_MODES
} from "pixi.js";
import { AdvancedBloomFilter, GlitchFilter } from "pixi-filters";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";

const displacementSprite: Sprite = Sprite.from(
  "https://res.cloudinary.com/dvxikybyi/image/upload/v1486634113/2yYayZk_vqsyzx.png"
);
displacementSprite.texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;

export class C {
  public static CANVAS_WIDTH = 640;
  public static CANVAS_HEIGHT = 640;

  public static TILE_WIDTH = 32;
  public static TILE_HEIGHT = 32;

  public static Renderer: Renderer;
  public static Loader: TypesafeLoader<typeof ResourcesToLoad>;
  public static Stage: Container;

  public static DreamFilters: Filter[] = [
    new AdvancedBloomFilter({ bloomScale: 0.5 }),
    new GlitchFilter(),
    new filters.DisplacementFilter(displacementSprite)
  ];
}
