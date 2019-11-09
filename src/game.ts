import { Application, SCALE_MODES, settings } from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { TiledTilemap } from "./library/tilemap";
import { Entity } from "./entity";
import { Rect } from "./library/rect";
import { CollisionGrid } from "./collision_grid";
import { Character } from "./character";
import { Camera } from "./camera";
import { GameState } from "./state";

export class Game {
  app: PIXI.Application;
  gameState: GameState;

  entities: { collidable: Entity[]; static: Entity[] } = {
    collidable: [],
    static: []
  };
  grid: CollisionGrid;
  debugMode: boolean;
  player!: Character;
  camera!: Camera;

  constructor() {
    this.debugMode = true;
    this.gameState = new GameState();

    this.app = new Application({
      width      : C.CANVAS_WIDTH,
      height     : C.CANVAS_HEIGHT,
      antialias  : true,
      transparent: false,
      resolution : 1
    });

    settings.SCALE_MODE = SCALE_MODES.NEAREST;

    C.Renderer = this.app.renderer;
    C.Loader = new TypesafeLoader(ResourcesToLoad);

    document.body.appendChild(this.app.view);

    this.grid = new CollisionGrid({
      game    : this,
      width   : 2 * C.CANVAS_WIDTH,
      height  : 2 * C.CANVAS_HEIGHT,
      cellSize: 8 * C.TILE_WIDTH,
      debug   : this.debugMode
    });

    C.Loader.onLoadComplete(this.startGame);
  }

  startGame = () => {
    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json         : C.Loader.getResource("maps/map.json").data,
      renderer     : C.Renderer,
      tileWidth    : C.TILE_WIDTH,
      tileHeight   : C.TILE_HEIGHT
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

    this.camera = new Camera({
      stage: this.app.stage,
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT
    });
    this.camera.follow(this.player);

    this.app.ticker.add(() => this.gameLoop());
  };

  gameLoop = () => {
    this.gameState.keys.update();

    for (let e of this.entities.collidable) {
      e.update(this.gameState);
    }

    this.grid.checkCollisions(this.entities.collidable);

    this.camera.update();
  };
}
