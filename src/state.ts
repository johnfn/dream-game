import { KeyboardState } from "./library/keyboard";
import { C } from "./constants";

import * as PIXI from "pixi.js";
import { Dialog } from "./dialog";
import { DreamMap } from "./dream_map";
import { Entity } from "./library/entity";
import { LightSource } from "./light_source";
import { Character } from "./character";
import { FollowCamera } from "./camera";
import { HeadsUpDisplay } from "./heads_up_display";
import { CollisionGrid } from "./collision_grid";
import { InteractableEntity } from "./library/interactable_entity";
import { HashSet } from "./library/hash";

export enum GameMode {
  Normal,
  Dialog,
}

export class GameState {
  inDreamWorld     = false;
  keys             : KeyboardState;
  map             !: DreamMap;

  character       !: Character;
  camera          !: FollowCamera;
  level           !: number;
  playerLighting  !: LightSource;
  dreamMapLayer   !: Entity;
  realityMapLayer !: Entity;
  objectLayer     !: Entity;
  shader           : PIXI.Graphics;
  dialog          !: Dialog;
  hud             !: HeadsUpDisplay;
  entities: {
    all         : HashSet<Entity>;
    collidable  : HashSet<Entity>;
    static      : HashSet<Entity>;
    interactable: HashSet<InteractableEntity>;
  } = {
    all         : new HashSet(),
    collidable  : new HashSet(),
    static      : new HashSet(),
    interactable: new HashSet(),
  };
  toBeDestroyed : Entity[];

  lightingGrid    !: CollisionGrid;

  // TODO: Maybe mode should be a stack?
  mode             : GameMode;

  /**
   * number of keys we've picked up in game
   */
  keyCount         = 1;
  
  constructor() {
    this.mode          = GameMode.Normal
    this.level         = 1;
    this.keys          = new KeyboardState();
    this.toBeDestroyed = [];

    this.shader = new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    this.shader.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    this.shader.width     = C.CANVAS_WIDTH;
    this.shader.height    = C.CANVAS_HEIGHT;
  }
}
