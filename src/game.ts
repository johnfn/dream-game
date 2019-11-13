import { Application, SCALE_MODES, settings, Point } from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { TiledTilemap } from "./library/tilemap";
import { Entity, EntityType } from "./library/entity";
import { Rect } from "./library/rect";
import { CollisionGrid } from "./collision_grid";
import { Character } from "./character";
import { FollowCamera } from "./camera";
import { GameState } from "./state";
import { MovingEntity } from "./library/moving_entity";
import { TestEntity } from "./test_entity";
import { Vector2 } from "./library/vector2";
import { DreamShard } from "./dream_shard";
import { InteractableEntity } from "./library/interactable_entity";
import { TypewriterText } from "./typewriter_text";
import { BaseNPC } from "./base_npc";

export class Game {
  static Instance: Game;

  app: PIXI.Application;
  gameState: GameState;

  entities: {
    all: Entity[];
    collidable: Entity[];
    static: Entity[];
    interactable: InteractableEntity[];
  } = {
    all: [],
    collidable: [],
    static: [],
    interactable: []
  };

  grid: CollisionGrid;
  debugMode: boolean;
  player!: Character;
  camera!: FollowCamera;
  testEntity: TestEntity;
  dreamShader!: PIXI.Graphics;

  constructor() {
    Game.Instance = this;

    this.debugMode = true;
    this.gameState = new GameState();

    this.app = new Application({
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT,
      antialias: true,
      transparent: false,
      resolution: 1
    });

    this.testEntity = new TestEntity();

    // This is insanity:

    // this.testEntity.position = new Point(0, 0);
    // const oldPosition = this.testEntity.position;
    // this.testEntity.position = new Point(10, 10);
    // console.log(oldPosition); // (10, 10)

    this.testEntity.position = new Point(100, 50);
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

  startGame = async () => {
    const tilemap = new TiledTilemap({
      pathToTilemap: "maps",
      json: C.Loader.getResource("maps/map.json").data,
      renderer: C.Renderer
    });

    this.gameState.map = tilemap;

    const layers = tilemap.loadRegionLayers(
      new Rect({
        x: 0,
        y: 0,
        w: 2048,
        h: 2048
      })
    );

    for (const { layerName, sprite } of layers) {
      if (layerName === "Dream Layer") {
        this.gameState.dreamMapLayer   = sprite;
      } else if (layerName === "Reality Ground Layer") {
        this.gameState.realityMapLayer = sprite;
      }

      this.app.stage.addChild(sprite);
    }

    this.player = new Character({
      game: this,
      spritesheet: C.Loader.getResource("art/char_spritesheet.json")
        .spritesheet!
    });

    this.player.x = 0;
    this.player.y = 200;

    this.app.stage.addChild(this.player);

    this.camera = new FollowCamera({
      stage: this.app.stage,
      followTarget: this.player,
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT
    });

    const testShard = new DreamShard();
    testShard.position.set(5, 5);
    this.app.stage.addChild(testShard);

    this.app.stage.addChild(this.gameState.shader);

    const text = new TypewriterText(
      `blah blah this is some text`,
      this,
    );

    this.app.stage.addChild(text);

    const npc = new BaseNPC();
    this.app.stage.addChild(npc);

    this.app.ticker.add(() => this.gameLoop());
  };

  // Note: For now, we treat map as a special case.
  // TODO: Load map into collision grid and use collision grid ONLY.
  private doesRectHitAnything = (rect: Rect, associatedEntity: Entity): boolean => {
    const tiles = [
      ...this.gameState.map.getTilesAt(rect.x         , rect.y),
      ...this.gameState.map.getTilesAt(rect.x + rect.w, rect.y),
      ...this.gameState.map.getTilesAt(rect.x         , rect.y + rect.h),
      ...this.gameState.map.getTilesAt(rect.x + rect.w, rect.y + rect.h),
    ];

    for (const tile of tiles) {
      if (tile !== null) {
        if (tile.isCollider) {
          return true;
        }
      }
    }

    const gridCollisions = this.grid.checkForCollision(rect, associatedEntity);

    if (gridCollisions.length > 0) {
      return true;
    }

    return false;
  };

  private resolveCollisions = () => {
    this.grid.clear();

    for (const entity of this.entities.collidable) {
      if (entity.isOnScreen()) {
        this.grid.add(entity.myGetBounds(), entity);
      }
    }

    const movingEntities: MovingEntity[] = this.entities.collidable.filter(
      ent => ent.entityType === EntityType.MovingEntity
    ) as MovingEntity[];

    for (const entity of movingEntities) {
      let updatedBounds = entity.myGetBounds();

      const xVelocity = new Vector2({ x: entity.velocity.x, y: 0 });
      const yVelocity = new Vector2({ x: 0, y: entity.velocity.y });

      // resolve x-axis

      updatedBounds = updatedBounds.add(xVelocity);

      if (this.doesRectHitAnything(updatedBounds, entity)) {
        updatedBounds = updatedBounds.subtract(xVelocity);
      }

      // resolve y-axis

      updatedBounds = updatedBounds.add(yVelocity);

      if (this.doesRectHitAnything(updatedBounds, entity)) {
        updatedBounds = updatedBounds.subtract(yVelocity);
      }

      entity.position.set(updatedBounds.x,updatedBounds.y);
    }
  }

  gameLoop = () => {
    this.gameState.keys.update();

    for (const entity of this.entities.all) {
      entity.update(this.gameState);
    }

    for (const interactor of this.entities.interactable) {
      // This will always be completely unnecessary (I hope), but we could use
      // the collsiion grid for this too

      // @gabby: what is diagonal distance???

      const distance = new Vector2(interactor.position).diagonalDistance(
        new Vector2(this.player.position)
      );

      if (distance < C.INTERACTION_DISTANCE && this.gameState.keys.justDown.E) {
        interactor.interact(this.player, this.gameState);

        break;
      }
    }

    this.resolveCollisions();

    this.camera.update();
  };
}
