import { Sprite, Rectangle } from 'pixi.js'
import { C } from '../constants';
import { ResourceName } from '../resources';

export class TextureCache {
  static Cache: { [key: string]: Sprite } = {};

  public static GetTextureFromSpritesheet({ textureName, x, y, tilewidth, tileheight }: { 
    textureName: ResourceName; 
    x          : number;
    y          : number;
    tilewidth  : number;
    tileheight : number;
  }): Sprite {
    const key = `${ textureName }-${ x }-${ y }`;

    if (!TextureCache.Cache[key]) {
      const texture = C.Loader.getResource(textureName).texture.clone();

      texture.frame = new Rectangle(x * tilewidth, y * tileheight, tilewidth, tileheight);

      // TODO: I don't understand why I use Sprite here rather than just saving the texture itself
      this.Cache[key] = new Sprite(texture);
    }

    return this.Cache[key];
  }
}