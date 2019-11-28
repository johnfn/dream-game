import { DreamBlob } from "./dream_blob";
import { GameState } from "../state";
import { Rect } from "../library/rect";

export class DreamBlobSine extends DreamBlob {
  blobWidth  = 800;
  blobHeight = 800;

  constructor() {
    super();
  }

  update(state: GameState) {
    this.blobWidth  = 500 + Math.sin(this.tick / 300) * 500; 
    this.blobHeight = 300;

    super.update(state);
  };

  bounds(): Rect {
    return new Rect({
      x: this.x,
      y: this.y,
      w: this.blobWidth,
      h: this.blobHeight,
    });
  }
}