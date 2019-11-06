import { Renderer } from 'pixi.js'
import { TypesafeLoader } from './library/typesafe_loader';
import { ResourcesToLoad } from './resources';

export class C {
  public static CANVAS_WIDTH = 600;
  public static CANVAS_HEIGHT = 600;

  public static TILE_WIDTH = 32;
  public static TILE_HEIGHT = 32;

  public static Renderer: Renderer;
  public static Loader: TypesafeLoader<typeof ResourcesToLoad>;
}