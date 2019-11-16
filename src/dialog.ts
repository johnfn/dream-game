import { GameState, GameMode } from "./state";
import { Entity } from "./library/entity";
import { C } from "./constants";
import { TextEntity } from "./library/text_entity";
import { InteractableEntity } from "./library/interactable_entity";

export class Dialog extends InteractableEntity {
  activeModes = [GameMode.Dialog];
  text: TextEntity;

  constructor() {
    super({
      texture   : C.Loader.getResource("art/dialog_box.png").texture,
      collidable: true,
      dynamic   : true,
    });

    this.position.set(200, 200)
    this.sprite.width = 400;

    this.text = new TextEntity(
      "%1%This is some dialog text", {
        1: { color   : "white", fontSize: 18, align: "right" }
      }
    );

    this.addChild(this.text);

    this.visible = false;
  }

  collide = () => {};

  update = (state: GameState) => {
  };

  isOnScreen = () => true

  interact = (other: Entity, gameState: GameState) => {
    Dialog.EndDialog(gameState);
  };

  interactRange = Number.POSITIVE_INFINITY;
  interactText  = "Keep Talking";

  static StartDialog(gameState: GameState) {
    gameState.mode = GameMode.Dialog;
    gameState.dialog.visible = true;
  }

  static EndDialog(gameState: GameState) {
    gameState.mode = GameMode.Normal;
    gameState.dialog.visible = false;
  }
}
