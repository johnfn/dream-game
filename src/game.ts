import { Application, Sprite } from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { TiledTilemap } from "./library/tilemap";
import { Entity } from "./entity";
import { Rect } from "./library/rect";
import { CollisionGrid } from "./collision_grid";
import {Character} from "./character";
import { Point } from "./library/point";

export class Game {
  app: PIXI.Application;
  entities: { collidable: Entity[]; static: Entity[] } = {
    collidable: [],
    static: []
  };
  grid: CollisionGrid;
  debugMode: boolean;
  keys: { [index: string]: boolean } = {};
  player!: Character;

  constructor() {
    this.debugMode = true;
    this.app = new Application({
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT,
      antialias: true,
      transparent: false,
      resolution: 1
    });

    C.Renderer = this.app.renderer;
    C.Loader = new TypesafeLoader(ResourcesToLoad);

    document.body.appendChild(this.app.view);

    this.grid = new CollisionGrid({
      game: this,
      width: 2*C.CANVAS_WIDTH,
      height: 2*C.CANVAS_HEIGHT,
      cellSize: C.TILE_WIDTH,
      debug: this.debugMode
    });

    window.onkeyup = (e: KeyboardEvent ):void => { this.keys[e.key] = false; }
    window.onkeydown = (e: KeyboardEvent ):void => { this.keys[e.key] = true; }

    C.Loader.onLoadComplete(this.startGame);
    
  }

  startGame = () => {
    // const cat = new Sprite(C.Loader.getResource("logo192.png").texture);

    // this.app.stage.addChild(cat);

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

    for (let i = 0; i < 50; i++) {
      const entity = new Entity({
        game: this,
        texture: C.Loader.getResource("art/temp.png").texture,
        collidable: true,
        dynamic: true
      });
      this.app.stage.addChild(entity);
    }

    this.player = new Character({
      game: this,
      texture: C.Loader.getResource("art/char.png").texture,
    });

    this.app.stage.addChild(this.player);

    this.app.ticker.add(() => this.gameLoop());
  };

  gameLoop = () => {

    // Get input
    this.player.handleInput(this.keys);

    // Update obj state
    for (let e of this.entities.collidable) {
      e.update();
    }

    this.grid.clear();

    for (let e of this.entities.collidable) {
      if (e.isOnScreen()) this.grid.add(e);
    }

    // Check for collisions using grid
    for (let cell of this.grid.cells) {
      const cellEntities = cell.entities;
      for (let i = 0; i < cellEntities.length; i++) {
        for (let j = i; j < cellEntities.length; j++) {
          if (i === j) continue;

          const ent1 = cellEntities[i];
          const ent2 = cellEntities[j];
          const bounds1: Rect = ent1.bounds;
          const bounds2: Rect = ent2.bounds;

          const intersection = bounds1.getIntersection(bounds2, false);

          if (!!intersection) {
            ent1.collide(ent2, intersection);
            ent2.collide(ent1, intersection);
          }
        }
      }
    }
  };

  
}
