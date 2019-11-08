import { Application, Sprite, SCALE_MODES, settings } from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { TiledTilemap } from "./library/tilemap";
import { Entity, BaseEntity } from "./entity";
import { Rect } from "./library/rect";
import { CollisionGrid } from "./collision_grid";
import { Character } from "./character";
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

    settings.SCALE_MODE = SCALE_MODES.NEAREST;

    C.Renderer = this.app.renderer;
    C.Loader = new TypesafeLoader(ResourcesToLoad);

    document.body.appendChild(this.app.view);

    this.grid = new CollisionGrid({
      game: this,
      width: 2 * C.CANVAS_WIDTH,
      height: 2 * C.CANVAS_HEIGHT,
      cellSize: 8 * C.TILE_WIDTH,
      debug: this.debugMode
    });

    window.onkeyup = (e: KeyboardEvent): void => {
      this.keys[e.key] = false;
    };
    window.onkeydown = (e: KeyboardEvent): void => {
      this.keys[e.key] = true;
    };

    C.Loader.onLoadComplete(this.startGame);
  }

  startGame = () => {
    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json: C.Loader.getResource("maps/map.json").data,
      renderer: C.Renderer,
      tileWidth: C.TILE_WIDTH,
      tileHeight: C.TILE_HEIGHT
    });

    const newRegion = tilemap.loadRegion(
      new Rect({
        x: 0,
        y: 0,
        w: 1024,
        h: 1024
      })
    );

    this.app.stage.addChild(newRegion);

    this.player = new Character({
      game: this,
      spritesheet: C.Loader.getResource("art/char_spritesheet.json")
        .spritesheet!
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
