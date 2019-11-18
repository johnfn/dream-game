import { Application, SCALE_MODES, settings, Container } from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { Entity, EntityType } from "./library/entity";
import { Rect } from "./library/rect";
import { CollisionGrid } from "./collision_grid";
import { Character } from "./character";
import { FollowCamera } from "./camera";
import { GameState } from "./state";
import { MovingEntity } from "./library/moving_entity";
import { Vector2 } from "./library/vector2";
import { DreamShard } from "./dream_shard";
import { InteractableEntity } from "./library/interactable_entity";
import { BaseNPC } from "./base_npc";
import { HeadsUpDisplay } from "./heads_up_display";
import { Dialog } from "./dialog";
import { DreamMap } from "./dream_map";
import { MyName } from "./my_name";

export class Game {
  static Instance: Game;

  app      : PIXI.Application;
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

  grid            : CollisionGrid;
  debugMode       : boolean;
  player         !: Character;
  camera         !: FollowCamera;
  dreamShader    !: PIXI.Graphics;

  /** 
   * The stage of the game. Put everything in-game on here.
   */
  stage           : Container;
  hud            !: HeadsUpDisplay;

  /** 
   * A stage for things in the game that don't move when the camera move and are
   * instead fixed to the screen. For example, the HUD.
   */
  fixedCameraStage: Container;

  constructor() {
    Game.Instance = this;

    this.debugMode = true;
    this.gameState = new GameState();

    this.app = new Application({
      width          : C.CANVAS_WIDTH,
      height         : C.CANVAS_HEIGHT,
      antialias      : true,
      transparent    : false,
      resolution     : window.devicePixelRatio,
      autoDensity    : true,
      backgroundColor: 0x666666,
    });

    this.stage = new Container();
    this.app.stage.addChild(this.stage);

    this.fixedCameraStage = new Container();
    this.app.stage.addChild(this.fixedCameraStage);

    // This is insanity:

    // this.testEntity.position = new Point(0, 0);
    // const oldPosition = this.testEntity.position;
    // this.testEntity.position = new Point(10, 10);
    // console.log(oldPosition); // (10, 10)

    settings.SCALE_MODE = SCALE_MODES.NEAREST;

    C.Renderer = this.app.renderer;
    C.Loader = new TypesafeLoader(ResourcesToLoad);
    C.Stage = this.stage;

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
    this.gameState.map = new DreamMap(this.gameState);
    this.stage.addChild(this.gameState.map);

    this.player = new Character({
      game: this,
      spritesheet: C.Loader.getResource("art/char_spritesheet.json")
        .spritesheet!
    });

    if (MyName === "grant") {
      this.player.x = 200;
      this.player.y = 900;
    } else {
      this.player.x = 200;
      this.player.y = 1200;
    }

    this.stage.addChild(this.player);

    this.camera = new FollowCamera({
      stage       : this.stage,
      followTarget: this.player,
      width       : C.CANVAS_WIDTH,
      height      : C.CANVAS_HEIGHT
    });

    const testShard = new DreamShard();
    testShard.position.set(5, 5);
    this.stage.addChild(testShard);

    this.stage.addChild(this.gameState.shader);

    // const text = new TypewriterText(
    //   `blah blah this is some text`,
    //   this,
    // );
    // this.fixedCameraStage.addChild(text);

    const npc = new BaseNPC();
    this.stage.addChild(npc);

    this.hud = new HeadsUpDisplay();
    this.fixedCameraStage.addChild(this.hud);

    this.gameState.dialog = new Dialog();
    this.fixedCameraStage.addChild(this.gameState.dialog);

    this.app.ticker.add(() => this.gameLoop()); 
  };

  // Note: For now, we treat map as a special case.
  // TODO: Load map into collision grid and use collision grid ONLY.
  private doesRectHitAnything = (rect: Rect, associatedEntity: Entity): boolean => {
    const hitMap = this.gameState.map.doesRectCollideMap(rect);

    if (hitMap) {
      console.log("hit map");

      return true;
    }

    const gridCollisions = this.grid.checkForCollision(rect, associatedEntity);

    if (gridCollisions.length > 0) {
      console.log(gridCollisions);

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

  handleInteractions = (activeEntities: InteractableEntity[]) => {
    // find potential interactor

    const sortedInteractors = activeEntities.slice().sort((a, b) => 
      new Vector2(a.position).diagonalDistance(new Vector2(this.player.position)) -
      new Vector2(b.position).diagonalDistance(new Vector2(this.player.position))
    );
    let targetInteractor: InteractableEntity | null = sortedInteractors[0];

    if (targetInteractor) {
      const distance = new Vector2(targetInteractor.position).diagonalDistance(
        new Vector2(this.player.position)
      );


      if (distance > C.INTERACTION_DISTANCE) {
        targetInteractor = null;
      } 
    }

    // found it. interact

    if (targetInteractor && this.gameState.keys.justDown.E) {
      targetInteractor.interact(this.player, this.gameState);
    }

    // update HUD (maybe move this code into HUD)

    if (targetInteractor) {
      this.hud.interactText.setText(`%1%e: ${ targetInteractor.interactText }`);
    } else {
      this.hud.interactText.setText(`%1%e: Nothing`);
    }
  };

  gameLoop = () => {
    this.gameState.keys.update();

    const activeEntities = this.entities.all
      .filter(entity => entity.activeModes.includes(this.gameState.mode));

    const activeInteractableEntities = this.entities.interactable
      .filter(entity => entity.activeModes.includes(this.gameState.mode));

    for (const entity of activeEntities) {
      entity.update(this.gameState);
    }

    this.handleInteractions(activeInteractableEntities);

    this.resolveCollisions();

    this.camera.update();
  };
}
