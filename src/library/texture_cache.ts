import { Rectangle, Texture } from 'pixi.js'
import { C } from '../constants';
import { ResourceName } from '../resources';
import { Tile } from './tilemap_types';

export class TextureCache {
  static Cache: { [key: string]: Texture } = {};

  public static GetTextureFromSpritesheet({ textureName, x, y, tilewidth, tileheight }: { 
    textureName: ResourceName; 
    x          : number;
    y          : number;
    tilewidth  : number;
    tileheight : number;
  }): Texture {
    const key = `${ textureName }-${ x }-${ y }`;

    if (!TextureCache.Cache[key]) {
      const texture = C.Loader.getResource(textureName).texture.clone();

      texture.frame = new Rectangle(x * tilewidth, y * tileheight, tilewidth, tileheight);

      // TODO: I don't understand why I use Sprite here rather than just saving the texture itself
      this.Cache[key] = texture;
    }

    return this.Cache[key];
  }

  public static GetTextureForTile(tile: Tile): Texture {
    const {
      tile: {
        imageUrlRelativeToGame,
        spritesheetx,
        spritesheety,
      },
    } = tile;

    return TextureCache.GetTextureFromSpritesheet({ 
      textureName: imageUrlRelativeToGame as ResourceName, // TODO: Is there any way to improve this cast?
      x          : spritesheetx, 
      y          : spritesheety, 
      tilewidth  : tile.tile.tilewidth, 
      tileheight : tile.tile.tileheight ,
    });
  }
}