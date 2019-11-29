import {
  Renderer,
  Filter,
  Container,
} from "pixi.js";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";

export class C {
  public static DEBUG = true;

  public static CANVAS_WIDTH = 640;
  public static CANVAS_HEIGHT = 640;

  public static TILE_WIDTH = 32;
  public static TILE_HEIGHT = 32;

  public static INTERACTION_RANGE = 200;

  public static Renderer: Renderer;
  public static Loader: TypesafeLoader<typeof ResourcesToLoad>;
  public static Stage: Container;

  public static DreamFilters: Filter[] = [ ];

  public static Depths = {
    Player: 10,
    ObjectLayerDepth: 10,
    TileLayerDepth: 0,
  };
}
