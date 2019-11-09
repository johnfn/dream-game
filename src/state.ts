import { KeyboardState } from "./library/keyboard";

export class GameState {
  keys: KeyboardState;

  constructor() {
    this.keys = new KeyboardState();
  }
}