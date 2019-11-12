import { TextEntity } from "./library/text_entity";
import { GameState } from "./state";
import { Game } from "./game";

export class TypewriterText extends TextEntity {
  finalText: string;

  constructor(text: string, game: Game) {
    super(text, game, 500, 500);

    this.finalText = text;
  }

  update = (state: GameState) => {

  }
}