import { Renderer, Filter, filters, Container } from 'pixi.js'
import { TypesafeLoader } from './library/typesafe_loader';
import { ResourcesToLoad } from './resources';

export class C {
  public static CANVAS_WIDTH = 640;
  public static CANVAS_HEIGHT = 640;

  public static TILE_WIDTH = 32;
  public static TILE_HEIGHT = 32;

  public static Renderer: Renderer;
  public static Loader: TypesafeLoader<typeof ResourcesToLoad>;
  public static Stage: Container;

  public static NoiseFilter: Filter = new filters.NoiseFilter(0.9);
}