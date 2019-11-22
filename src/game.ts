import {
  Application,
  Container,
  Shader,
  Mesh,
  Geometry,
  BLEND_MODES,
  Texture,
  Sprite,
  RenderTexture,
} from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { Entity, EntityType } from "./library/entity";
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
import { LightSource } from "./light_source";
import { Debug } from "./library/debug";

export class Game {
  uniforms!: {
    u_time: number;
    u_texture: Texture;
  };

  renderTex!: RenderTexture;

  dreamShader!: Sprite;
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

  debugMode   : boolean;
  player     !: Character;
  camera     !: FollowCamera;

  /**
   * The stage of the game. Put everything in-game on here.
   */
  stage: Container;
  hud!: HeadsUpDisplay;

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
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT,
      antialias: true,
      transparent: false,
      resolution: window.devicePixelRatio,
      autoDensity: true,
      backgroundColor: 0x666666
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

    //settings.SCALE_MODE = SCALE_MODES.NEAREST;

    C.Renderer = this.app.renderer;
    C.Loader = new TypesafeLoader(ResourcesToLoad);
    C.Stage = this.stage;

    document.body.appendChild(this.app.view);
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

    this.gameState.character = this.player;

    if (MyName === "grant") {
      this.player.x = 950;
      this.player.y = 1595;
    } else {
      this.player.x = 950;
      this.player.y = 1595;
    }

    this.stage.addChild(this.player);

    this.camera = new FollowCamera({
      stage: this.stage,
      followTarget: this.player,
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT
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

    this.gameState.playerLighting = new LightSource(this.gameState, this.buildCollisionGrid());
    this.stage.addChild(this.gameState.playerLighting);
    //this.addDreamShader();
  };

  private resolveCollisions = (grid: CollisionGrid) => {
    const movingEntities: MovingEntity[] = this.entities.collidable.filter(
      ent => ent.entityType === EntityType.MovingEntity
    ) as MovingEntity[];

    for (const entity of movingEntities) {
      let updatedBounds = entity.myGetBounds();

      const xVelocity = new Vector2({ x: entity.velocity.x, y: 0 });
      const yVelocity = new Vector2({ x: 0, y: entity.velocity.y });

      // resolve x-axis

      updatedBounds = updatedBounds.add(xVelocity);

      if (grid.collidesRect(updatedBounds, entity).length > 0) {
        updatedBounds = updatedBounds.subtract(xVelocity);
      }

      // resolve y-axis

      updatedBounds = updatedBounds.add(yVelocity);

      if (grid.collidesRect(updatedBounds, entity).length > 0) {
        updatedBounds = updatedBounds.subtract(yVelocity);
      }

      entity.position.set(updatedBounds.x, updatedBounds.y);
    }
  };

  handleInteractions = (activeEntities: InteractableEntity[]) => {
    // find potential interactor

    const sortedInteractors = activeEntities
      .filter(ent => ent.canInteract())
      .slice()
      .sort(
        (a, b) =>
          new Vector2(a.position).diagonalDistance(
            new Vector2(this.player.position)
          ) -
          new Vector2(b.position).diagonalDistance(
            new Vector2(this.player.position)
          )
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
      this.hud.interactText.setText(`%1%e: ${targetInteractor.interactText}`);
    } else {
      this.hud.interactText.setText(`%1%e: Nothing`);
    }
  };

  buildCollisionGrid = (): CollisionGrid => {
    const grid = new CollisionGrid({
      game    : this,
      width   : 2 * C.CANVAS_WIDTH,
      height  : 2 * C.CANVAS_HEIGHT,
      cellSize: 16 * C.TILE_WIDTH,
      debug   : this.debugMode
    });

    for (const entity of this.entities.collidable) {
      if (entity.isOnScreen()) {
        grid.add(entity.myGetBounds(), entity);
      }
    }

    const mapColliders = this.gameState.map.getCollidersInRegion(
      this.camera.bounds().expand(1000)
    );

    for (const mapCollider of mapColliders) {
      grid.add(mapCollider, this.gameState.map);
    }

    return grid;
  };

  gameLoop = () => {
    Debug.Clear();

    this.gameState.keys.update();

    const activeEntities = this.entities.all.filter(entity =>
      entity.activeModes.includes(this.gameState.mode)
    );

    const activeInteractableEntities = this.entities.interactable.filter(
      entity => entity.activeModes.includes(this.gameState.mode)
    );

    for (const entity of activeEntities) {
      entity.update(this.gameState);
    }

    this.handleInteractions(activeInteractableEntities);

    const grid = this.buildCollisionGrid();

    this.resolveCollisions(grid);


    this.gameState.playerLighting.buildLighting(this.gameState, grid);

    this.uniforms.u_time += 0.01;
    C.Renderer.render(this.gameState.playerLighting.graphics, this.renderTex);

    this.camera.update();
  };

  addDreamShader = () => {
    this.renderTex = RenderTexture.create({
      width: C.CANVAS_WIDTH,
      height: C.CANVAS_HEIGHT
    });
    C.Renderer.render(this.gameState.playerLighting.graphics, this.renderTex);

    this.uniforms = {
      u_time: 1,
      u_texture: this.renderTex
    };

    const vertexSrc = `
      precision mediump float;
      
      attribute vec2 aUVs;
      attribute vec2 aVertexPosition;
      attribute vec3 aColor;
  
      uniform mat3 translationMatrix;
      uniform mat3 projectionMatrix;
  
      varying vec3 vColor;
      varying vec2 vUVs;

  
      void main() {
          vUVs = aUVs;
          vColor = aColor;
          gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
  
      }`;

    const fragSrc = `
      precision mediump float;

      varying vec2 vUVs;
      varying vec3 vColor;

      uniform float u_time;
      uniform sampler2D u_texture;
    
  
      void main() {
        vec4 color = vec4(sin(u_time));
        vec4 texture = texture2D(u_texture, vUVs);
        gl_FragColor = texture * vec4(1.0,1.0,1.0,1.0);
      }
  `;

    const stageBounds = new Geometry()
      .addAttribute("aVertexPosition", [0, 0, 1, 0, 0, 1, 1, 1], 2)
      .addAttribute("aUVs", [0, 0, 1, 0, 0, 1, 1, 1], 2)
      .addAttribute("aColor", [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], 3)
      .addIndex([0, 1, 2, 1, 2, 3]);

    const shader = Shader.from(vertexSrc, fragSrc, this.uniforms);
    const square = new Mesh(stageBounds, shader);
    square.blendMode = BLEND_MODES.ADD;
    square.scale.set(C.CANVAS_WIDTH);
    this.fixedCameraStage.addChild(square);
  };
}
