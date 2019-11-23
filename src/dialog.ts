import { GameState, GameMode } from "./state";
import { Entity } from "./library/entity";
import { C } from "./constants";
import { InteractableEntity } from "./library/interactable_entity";
import { TypewriterText } from "./typewriter_text";

export class Dialog extends InteractableEntity {
  static Instance: Dialog;

  activeModes = [GameMode.Dialog];
  text: TypewriterText;

  constructor() {
    super({
      texture   : C.Loader.getResource("art/dialog_box.png").texture,
      collidable: false,
    });

    Dialog.Instance = this;

    this.position.set(200, 200)
    this.sprite.width = 400;

    this.text = new TypewriterText(
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
    if (this.text.isDone()) {
      Dialog.EndDialog(gameState);
    } else {
      this.text.finishText();
    }
  };

  interactRange = Number.POSITIVE_INFINITY;
  interactText  = "Keep Talking";
  canInteract   = () => true;

  static StartDialog(gameState: GameState) {
    Dialog.Instance.text.start();

    gameState.mode = GameMode.Dialog;
    gameState.dialog.visible = true;
  }

  static EndDialog(gameState: GameState) {
    gameState.mode = GameMode.Normal;
    gameState.dialog.visible = false;
  }
}
