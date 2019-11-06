import { Application, Sprite } from 'pixi.js'
import { C } from './constants';
import { TypesafeLoader } from './library/typesafe_loader';
import { ResourcesToLoad } from './resources';
import { TiledTilemap } from './library/tilemap';
import { Entity } from './entity';

export class Game {
  app: PIXI.Application;
  entities: Entity[] = [];

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

    this.app.ticker.add(() => this.gameLoop())
  }

  gameLoop = () => {
    // Update obj state
    for (let e of this.entities) {
      e.update();
    }

    // Check for collisions
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i; j < this.entities.length; j++) {

        if (i === j) continue;

        const ent1: Entity = this.entities[i];
        const ent2: Entity = this.entities[j];

        if (ent1.bounds.intersects(ent2.bounds, {edgesOnlyIsAnIntersection: false})) {
          //There's probably an intersection
        }
      }
    }
  }
}