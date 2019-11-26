import { KeyboardState } from "./library/keyboard";
import { C } from "./constants";

import * as PIXI from "pixi.js";
import { Dialog } from "./dialog";
import { DreamMap } from "./map/dream_map";
import { Entity } from "./library/entity";
import { LightSource } from "./light_source";
import { Character } from "./character";
import { FollowCamera } from "./camera";
import { HeadsUpDisplay } from "./heads_up_display";
import { CollisionGrid } from "./collision_grid";
import { InteractableEntity } from "./library/interactable_entity";
import { HashSet } from "./library/hash";
import { BaseLight as BaseLightEntity } from "./entities/base_light";
import { Container } from "pixi.js";

export enum GameMode {
  Normal,
  Dialog,
}

export class GameState {
  inDreamWorld     = false;
  keys             : KeyboardState;
  map             !: DreamMap;

  stage           !: Container;
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
  entities         = new HashSet<Entity>();
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

  getCollideableEntities(): HashSet<Entity> {
    return new HashSet(
      this.entities.values().filter(ent => ent.isCollideable())
    );
  }

  getStaticEntities(): HashSet<Entity> {
    return new HashSet(
      this.entities.values().filter(ent => !ent.isCollideable())
    );
  }

  getInteractableEntities(): HashSet<InteractableEntity> {
    return new HashSet(
      this.entities.values().filter(ent => ent.isInteractable()) as InteractableEntity[]
    );
  }

  getLightEntities(): HashSet<BaseLightEntity> {
    return new HashSet(
      this.entities.values().filter(ent => ent.isLight()) as BaseLightEntity[]
    );
  }
}
