import { GameState, GameMode } from "./state";
import { TextEntity, TextStyles, TextSegmentState, AdvanceState as AdvanceTextState } from "./library/text_entity";

export class TypewriterText extends TextEntity {
  activeModes = [GameMode.Dialog];
  finalText: string;
  displayedText: string;
  tick = 0;
  textState = TextSegmentState.NormalText;
  started = false;

  constructor(text: string, styles: TextStyles) {
    super("", styles);

    this.finalText = text;
    this.displayedText = "";
    this.setText("");
  }

  start() {
    this.clear();

    this.displayedText = "";
    this.started = true;
  }

  update = (state: GameState) => {
    if (!this.started) {
      return;
    }

    ++this.tick;

    const nextChar = () => this.finalText[this.displayedText.length];

    if (this.tick % 2 === 0 && this.displayedText.length !== this.finalText.length) {
      // advance text

      let char = nextChar();
      this.displayedText += char;

      // skip over %s and id sections
      // TODO this is too coupled to TextEntity formatting

      if (char === "%") {
        this.textState = AdvanceTextState(this.textState);
        this.displayedText += nextChar()

        if (this.textState === TextSegmentState.IdText) {
          while (char !== "%") {
            char = nextChar();
            this.displayedText += char;
          }

          this.textState = AdvanceTextState(this.textState);
        }
      }

      this.setText(this.displayedText);
    }
  }
}