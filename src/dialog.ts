import { GameState, GameMode } from "./state";
import { Entity } from "./library/entity";
import { C } from "./constants";
import { InteractableEntity } from "./library/interactable_entity";
import { TypewriterText, TypewritingState } from "./entities/typewriter_text";
import { TextStyles } from "./library/text_entity";

export type DialogSpeaker =
  | "You"
  | "Sign"
  | "Door"
  | "Trash Can"
  | "Treasure Chest"

export type DialogSegment = {
  speaker : DialogSpeaker;
  text    : string;
  style  ?: TextStyles;
};

export class Dialog extends InteractableEntity {
  static Instance: Dialog;

  activeModes = [GameMode.Dialog];
  text        : TypewriterText;
  segments    : DialogSegment[];

  constructor() {
    super({
      texture   : C.Loader.getResource("art/dialog_box.png").texture,
      collidable: false,
    });

    Dialog.Instance = this;

    this.segments = [];
    this.position.set(200, 300)
    this.sprite.width = 400;

    console.log("Construct")

    this.text = new TypewriterText(
      "%1%This is some dialog text", {
        1: { color: "white", fontSize: 18, align: "left" },
        2: { color: "red"  , fontSize: 18, align: "left" },
      }
    );

    this.addChild(this.text);
    this.visible = false;
  }

  start(content: DialogSegment[]) {
    this.segments = content;

    this.startNextDialogSegment();
  }

  startNextDialogSegment(): void {
    const nextDialog = this.segments.shift()!;

    this.text.start(nextDialog.text);
  }

  collide = () => {};

  update = (state: GameState) => {
  };

  interact = (other: Entity, gameState: GameState) => {
    if (this.text.isDone()) {
      if (this.segments.length > 0) {
        this.startNextDialogSegment();
      } else {
        Dialog.EndDialog(gameState);
      }
    } else {
      this.text.finishText();
    }
  };

  interactRange = Number.POSITIVE_INFINITY;

  interactText = () => {
    return "";
  };

  canInteract = () => true;

  static StartDialog(gameState: GameState, content: DialogSegment[]) {
    Dialog.Instance.start(content);

    gameState.mode = GameMode.Dialog;
    gameState.dialog.visible = true;
  }

  static EndDialog(gameState: GameState) {
    gameState.mode = GameMode.Normal;
    gameState.dialog.visible = false;
  }
}
