import { Application, Sprite } from 'pixi.js'
import { C } from './constants';
import { TypesafeLoader } from './library/typesafe_loader';
import { ResourcesToLoad } from './resources';
import { TiledTilemap } from './library/tilemap';
import { Rect } from './library/rect';

export class Game {
  app: PIXI.Application;

  constructor() {
    this.app = new Application({
      width      : C.CANVAS_WIDTH,
      height     : C.CANVAS_HEIGHT,
      antialias  : true,
      transparent: false,
      resolution : 1
    });

    C.Renderer = this.app.renderer;
    C.Loader   = new TypesafeLoader(ResourcesToLoad);

    document.body.appendChild(this.app.view);

    C.Loader.onLoadComplete(this.startGame)
  }

  startGame = () => {
    const cat = new Sprite(C.Loader.getResource("logo192.png").texture);

    this.app.stage.addChild(cat);

    /*

    TODO: Make this API work

    const tilemap = new TiledTilemap({
      json      : C.Loader.getResource("maps/map.json").data,
      renderer  : C.Renderer,
      tileWidth : C.TILE_WIDTH,
      tileHeight: C.TILE_HEIGHT,
    })

    const newRegion = tilemap.loadRegion(new Rect({
      x: 0,
      y: 0,
      w: 1024,
      h: 1024,
    }));

    this.app.stage.addChild(newRegion);
    */
  }
}