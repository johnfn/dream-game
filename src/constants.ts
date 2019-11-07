import { Renderer } from 'pixi.js'
import { TypesafeLoader } from './library/typesafe_loader';
import { ResourcesToLoad } from './resources';

export class C {
  public static CANVAS_WIDTH = 640;
  public static CANVAS_HEIGHT = 640;

  public static TILE_WIDTH = 128;
  public static TILE_HEIGHT = 128;

  public static Renderer: Renderer;
  public static Loader: TypesafeLoader<typeof ResourcesToLoad>;
}