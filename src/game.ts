import { Application, SCALE_MODES, settings, Point } from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { TiledTilemap } from "./library/tilemap";
import { Entity, EntityType } from "./library/entity";
import { Rect } from "./library/rect";
import { CollisionGrid } from "./collision_grid";
import { Character } from "./character";
import { Camera } from "./camera";
import { GameState } from "./state";
import { MovingEntity } from "./library/moving_entity";
import { TestEntity } from "./test_entity";

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
  testEntity: TestEntity;

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

    this.testEntity = new TestEntity({ game: this });

    // This is insanity: 

    // this.testEntity.position = new Point(0, 0);
    // const oldPosition = this.testEntity.position;
    // this.testEntity.position = new Point(10, 10);
    // console.log(oldPosition); // (10, 10)

    this.app.stage.addChild(this.testEntity);

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
    });

    const newRegion = tilemap.loadRegion(
      new Rect({
        x: 0,
        y: 0,
        w: 2048,
        h: 2048
      })
    );

    this.gameState.map = tilemap;

    this.app.stage.addChild(newRegion);

    this.player = new Character({
      game: this,
      spritesheet: C.Loader.getResource("art/char_spritesheet.json")
        .spritesheet!
    });

    this.app.stage.addChild(this.player);

    this.camera = new Camera({
      stage : this.app.stage,
      width : C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT
    });

    this.camera.follow(this.player);

    this.app.ticker.add(() => this.gameLoop());
  };

  private resolveCollisions = () => {
    this.grid.clear();

    for (const e of this.entities.collidable) {
      if (e.isOnScreen()) {
        this.grid.add(e.bounds);
      }
    }

    const movingEntities: MovingEntity[] = this.entities.collidable.filter(
      ent => ent.entityType === EntityType.MovingEntity
    ) as MovingEntity[];

    outer: 
    for (const entity of movingEntities) {
      const newPosition = new Point(
        entity.position.x + entity.velocity.x,
        entity.position.y + entity.velocity.y
      );

      const tiles = [
        this.gameState.map.getTileAt(newPosition.x               , newPosition.y),
        this.gameState.map.getTileAt(newPosition.x + entity.width, newPosition.y),
        this.gameState.map.getTileAt(newPosition.x               , newPosition.y + entity.height),
        this.gameState.map.getTileAt(newPosition.x + entity.width, newPosition.y + entity.height),
      ];

      for (const tile of tiles) {
        if (tile !== null) {
          if (tile.isCollider) {
            continue outer;
          }
        }
      }

      if (this.grid.checkForCollision(new Rect({
          x: newPosition.x,
          y: newPosition.y,
          w: newPosition.x + entity.width,
          h: newPosition.x + entity.height,
        }))) {

        continue;
      }

      entity.position = newPosition;
    }

    // console.log(this.grid.getAllCollisions());
  }

  gameLoop = () => {
    this.gameState.keys.update();

    for (const e of this.entities.collidable) {
      e.update(this.gameState);
    }

    this.resolveCollisions();

    this.camera.update();
  };
}
