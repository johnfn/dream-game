import { Application, SCALE_MODES, settings, filters } from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { TiledTilemap } from "./library/tilemap";
import { Entity, EntityType } from "./library/entity";
import { Rect } from "./library/rect";
import { CollisionGrid } from "./collision_grid";
import { Character } from "./character";
import { Camera } from "./camera";
import { GameState, DreamState } from "./state";
import { MovingEntity } from "./library/moving_entity";
import { TestEntity } from "./test_entity";
import { Vector2 } from "./library/vector2";
import { DreamShard } from "./dream_shard";
import { InteractableEntity } from "./library/interactable_entity";

export class Game {
  app: PIXI.Application;
  gameState: GameState;

  entities: {
    collidable: Entity[];
    static: Entity[];
    interactable: InteractableEntity[];
  } = {
    collidable: [],
    static: [],
    interactable: []
  };
  grid: CollisionGrid;
  debugMode: boolean;
  player!: Character;
  camera!: Camera;
  testEntity: TestEntity;
  dreamShader!: PIXI.Graphics;

  constructor() {
    this.debugMode = true;
    this.gameState = new GameState();

    this.app = new Application({
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT,
      antialias: true,
      transparent: false,
      resolution: 1
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
    C.Stage = this.app.stage;

    document.body.appendChild(this.app.view);

    this.grid = new CollisionGrid({
      game: this,
      width: 2 * C.CANVAS_WIDTH,
      height: 2 * C.CANVAS_HEIGHT,
      cellSize: 8 * C.TILE_WIDTH,
      debug: this.debugMode
    });

    C.Loader.onLoadComplete(this.startGame);
  }

  startGame = () => {
    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json: C.Loader.getResource("maps/map.json").data,
      renderer: C.Renderer
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
      stage: this.app.stage,
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT
    });

    this.camera.follow(this.player);

    const testShard = new DreamShard({ game: this });
    testShard.position.set(5, 5);
    this.app.stage.addChild(testShard);

    this.app.stage.addChild(this.gameState.shader);

    this.app.ticker.add(() => this.gameLoop());
  };

  private doesRectHitAnything = (rect: Rect): boolean => {
    const tiles = [
      this.gameState.map.getTileAt(rect.x, rect.y),
      this.gameState.map.getTileAt(rect.x + rect.w, rect.y),
      this.gameState.map.getTileAt(rect.x, rect.y + rect.h),
      this.gameState.map.getTileAt(rect.x + rect.w, rect.y + rect.h)
    ];

    for (const tile of tiles) {
      if (tile !== null) {
        if (tile.isCollider) {
          return true;
        }
      }
    }

    if (this.grid.checkForCollision(rect)) {
      return true;
    }

    return false;
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

    for (const entity of movingEntities) {
      let updatedBounds = entity.bounds;

      continue;

      const xVelocity = new Vector2({ x: entity.velocity.x, y: 0 });
      const yVelocity = new Vector2({ x: 0, y: entity.velocity.y });

      // resolve x-axis

      updatedBounds = updatedBounds.add(xVelocity);

      if (this.doesRectHitAnything(updatedBounds)) {
        updatedBounds = updatedBounds.subtract(xVelocity);
      }

      // resolve y-axis

      updatedBounds = updatedBounds.add(yVelocity);

      if (this.doesRectHitAnything(updatedBounds)) {
        updatedBounds = updatedBounds.subtract(yVelocity);
      }

      entity.x = updatedBounds.x;
      entity.y = updatedBounds.y;
    }

    // console.log(this.grid.getAllCollisions());
  };

  gameLoop = () => {
    this.gameState.keys.update();

    for (const e of this.entities.collidable) {
      e.update(this.gameState);
    }

    for (const e of this.entities.interactable) {
      e.interact(this.player, this.gameState);
    }

    this.resolveCollisions();

    this.camera.update();
  };
}
