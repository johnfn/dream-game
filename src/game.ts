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
  WRAP_MODES,
  Point,
} from "pixi.js";
import { C } from "./constants";
import { TypesafeLoader } from "./library/typesafe_loader";
import { ResourcesToLoad } from "./resources";
import { CollisionGrid } from "./collision_grid";
import { Character } from "./character";
import { FollowCamera } from "./camera";
import { GameState } from "./state";
import { DreamShard } from "./dream_shard";
import { HeadsUpDisplay } from "./heads_up_display";
import { Dialog } from "./dialog";
import { DreamMap } from "./map/dream_map";
import { MyName } from "./my_name";
import { LightSource } from "./light_source";
import { Debug } from "./library/debug";
import { CharacterStart } from "./entities/character_start";
import { InteractionHandler } from "./core/interaction_handler";
import { HashSet } from "./library/hash";
import { CollisionHandler } from "./core/collision_handler";

export class Game {
  static Instance: Game;

  uniforms!: {
    u_time            : number;
    u_lighting_tex    : Texture;
    u_displacement    : Texture;
    u_displacement_amt: number;
  };

  app                : PIXI.Application;
  renderTex         !: RenderTexture;
  dreamShader       !: Sprite;
  state              : GameState;
  debugMode          : boolean;
  player            !: Character;
  camera            !: FollowCamera;
  shadedLighting    !: Mesh;
  interactionHandler!: InteractionHandler;
  collisionHandler  !: CollisionHandler;
  hud               !: HeadsUpDisplay;

  /**
   * The stage of the game. Put everything in-game on here.
   */
  stage              : Container;

  /**
   * A stage for things in the game that don't move when the camera move and are
   * instead fixed to the screen. For example, the HUD.
   */
  fixedCameraStage: Container;

  constructor() {
    Game.Instance = this;

    this.debugMode = true;
    this.state = new GameState();

    this.app = new Application({
      width          : C.CANVAS_WIDTH,
      height         : C.CANVAS_HEIGHT,
      antialias      : true,
      transparent    : false,
      resolution     : window.devicePixelRatio,
      autoDensity    : true,
      backgroundColor: 0x666666,
      view           : document.getElementById("canvas")! as any,
    });

    this.stage = new Container();
    this.state.stage = this.stage;

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

    C.Loader.onLoadComplete(this.startGame);
  }

  startGame = async () => {
    this.player = new Character({
      game: this,
    });

    this.state.character = this.player;

    this.camera = new FollowCamera({
      stage       : this.stage,
      state       : this.state,
      followTarget: this.player,
      width       : C.CANVAS_WIDTH,
      height      : C.CANVAS_HEIGHT
    });
    this.state.camera = this.camera;

    this.state.map = new DreamMap(this.state);
    this.stage.addChild(this.state.map);

    this.stage.addChild(this.player);

    const testShard = new DreamShard();
    testShard.position.set(5, 5);
    this.stage.addChild(testShard);

    this.stage.addChild(this.state.shader);

    this.hud = new HeadsUpDisplay();
    this.state.hud = this.hud;
    this.fixedCameraStage.addChild(this.hud);

    this.state.dialog = new Dialog();
    this.fixedCameraStage.addChild(this.state.dialog);

    this.app.ticker.add(() => this.gameLoop());

    this.state.playerLighting = new LightSource();
    // this.stage.addChild(this.gameState.playerLighting);
    this.addDreamShader();

    this.interactionHandler = new InteractionHandler(this.stage);
    this.collisionHandler   = new CollisionHandler();

    if (MyName === "grant") {
      this.player.x = Number(window.localStorage.getItem("characterx")) || CharacterStart.Instance.x;
      this.player.y = Number(window.localStorage.getItem("charactery")) || CharacterStart.Instance.y;

      // this.player.x = 600;
      // this.player.y = 600;

      const grid = this.collisionHandler.buildCollisionGrid(this.state);

      while (
        grid.getRectGroupCollisions(this.player.collisionBounds(this.state)).length > 0
      ) {
        this.player.y += 5;
      }
    } else {
      this.player.x = 950;
      this.player.y = 1595;
    }

    this.stage.sortableChildren = true;
  };

  gameLoop = () => {
    const { entities } = this.state;

    this.uniforms.u_time += 0.01;

    // console.log(Debug.GetDrawCount());

    Debug.Clear();

    this.state.keys.update();

    const activeEntities = entities.values().filter(entity =>
      entity.activeModes.includes(this.state.mode)
    );

    for (const entity of activeEntities) {
      entity.update(this.state);
    }

    this.state.entities = new HashSet(entities.values().filter(ent => !this.state.toBeDestroyed.includes(ent)));

    const grid = this.collisionHandler.buildCollisionGrid(this.state);

    for (const lightEntity of this.state.getLightEntities().values()) {
      lightEntity.updateLight(this.state, grid);
    }

    this.collisionHandler.resolveCollisions(this.state, grid);

    this.renderLightingToTexture(this.renderTex, grid);

    this.camera.update(this.state);

    this.interactionHandler.update({
      activeEntities: this.state.getInteractableEntities(),
      gameState     : this.state,
    });

    Debug.ClearDrawCount();

    if (C.DEBUG) {
      Debug.DebugStuff(this.state);
    }
  };

  renderLightingToTexture = (renderTexture: RenderTexture, grid: CollisionGrid) => {
    if (this.state.inDreamWorld) {
      const { graphics, offsetX, offsetY } = this.state.playerLighting.buildLighting(grid, this.player, this.camera.bounds().expand(100));

      // Note: we need to be careful not to render to negative coordinates on the
      // render texture because anything rendered at a negative coordinate is
      // clipped immediately. That's why lighting always renders to (0, 0) and
      // passes back an offset.
      C.Renderer.render(graphics, renderTexture);

      this.shadedLighting.x = offsetX;
      this.shadedLighting.y = offsetY;

      this.shadedLighting.visible = true;
    } else {
      this.shadedLighting.visible = false;
    }
  };

  addDreamShader = () => {
    const width  = 2000;
    const height = 2000;

    this.renderTex = RenderTexture.create({
      width ,
      height,
    });
    C.Renderer.render(this.state.playerLighting.graphics, this.renderTex);

    const displacementSprite: Sprite = Sprite.from(
      "https://res.cloudinary.com/dvxikybyi/image/upload/v1486634113/2yYayZk_vqsyzx.png"
    );

    displacementSprite.texture.baseTexture.wrapMode = WRAP_MODES.MIRRORED_REPEAT

    this.uniforms = {
      u_time: 1,
      u_lighting_tex: this.renderTex,
      u_displacement: displacementSprite.texture,
      u_displacement_amt: 0.02, //in texels
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
      uniform sampler2D u_lighting_tex;
      uniform sampler2D u_displacement;
      uniform float u_displacement_amt;
  
      void main() {
        float time_e      = u_time * 0.1;

        vec2 uv_t         = vec2(vUVs.s + time_e, vUVs.t + time_e);
        vec4 displace     = texture2D(u_displacement, uv_t);
 
        float displace_k  = displace.g * u_displacement_amt;
        vec2 uv_displaced = vec2(vUVs.x + displace_k, vUVs.y + displace_k);

        vec4 color = vec4(abs(sin(u_time)), abs(sin(u_time+1.0)), abs(sin(u_time+2.0)), 1.0);
        vec2 adjust = vec2(u_displacement_amt)/2.;
        vec4 texture = texture2D(u_lighting_tex, uv_displaced-adjust);
        gl_FragColor = texture * color;
      }
  `;

    const stageBounds = new Geometry()
      .addAttribute("aVertexPosition", [0, 0, width, 0, 0, height, width, height], 2)
      .addAttribute("aUVs", [0, 0, 1, 0, 0, 1, 1, 1], 2)
      .addAttribute("aColor", [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], 3)
      .addIndex([0, 1, 2, 1, 2, 3]);

    const shader = Shader.from(vertexSrc, fragSrc, this.uniforms);

    this.shadedLighting = new Mesh(stageBounds, shader);
    this.shadedLighting.blendMode = BLEND_MODES.ADD;

    this.stage.addChild(this.shadedLighting);
  };
}
