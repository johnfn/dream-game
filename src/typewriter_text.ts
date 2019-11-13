import { BaseTextEntity } from "./library/base_text_entity";
import { GameState } from "./state";
import { Game } from "./game";

export class TypewriterText extends BaseTextEntity {
  finalText: string;
  displayedText: string;
  tick = 0;

  constructor(text: string, game: Game) {
    super(text, 500, 500);

    this.finalText = text;
    this.displayedText = "";

    this.html = `<div style="color: red; font-family: FreePixel; font-size: 20px">i deed it<div>`;
  }

  update = (state: GameState) => {
    ++this.tick;

    if (this.tick % 2 === 0 && this.displayedText.length !== this.finalText.length) {
     this.displayedText += this.finalText[this.displayedText.length];

      this.html = (
        `<div style="color: red; font-family: FreePixel; font-size: 20px">${ this.displayedText }</div>`
      );
    }
  }
}