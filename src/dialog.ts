import { GameState, GameMode } from "./state";
import { Entity } from "./library/entity";
import { C } from "./constants";
import { InteractableEntity } from "./library/interactable_entity";
import { TypewriterText, TypewritingState } from "./entities/typewriter_text";
import { TextStyles, TextEntity } from "./library/text_entity";

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
  dialogText  : TypewriterText;
  portraitText: TextEntity;
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

    this.dialogText = new TypewriterText(
      "%1%This is some dialog text", {
        1: { color: "white", fontSize: 18, align: "left" },
        2: { color: "red"  , fontSize: 18, align: "left" },
      },
      300
    );

    this.dialogText.x = 100;

    this.addChild(this.dialogText);

    this.portraitText = new TextEntity(
      `%1%Name here`, {
        1: { color: "white", fontSize: 14, align: "center" },
      },
      100,
    );

    this.portraitText.x = 0;
    this.portraitText.y = 100;

    this.addChild(this.portraitText);

    this.visible = false;
  }

  start(content: DialogSegment[]) {
    this.segments = content;

    this.startNextDialogSegment();
  }

  startNextDialogSegment(): void {
    const nextDialog = this.segments.shift()!;

    this.dialogText.startTypewriting(nextDialog.text);
    this.portraitText.setText(`%1%${ nextDialog.speaker }`);
  }

  collide = () => {};

  update = (state: GameState) => {
  };

  interact = (other: Entity, gameState: GameState) => {
    if (this.dialogText.isDone()) {
      if (this.segments.length > 0) {
        this.startNextDialogSegment();
      } else {
        Dialog.EndDialog(gameState);
      }
    } else {
      this.dialogText.finishText();
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
