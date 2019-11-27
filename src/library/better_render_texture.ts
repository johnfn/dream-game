import { RenderTexture } from "pixi.js";

export class BetterRenderTexture {
  renderTexture: RenderTexture;

  constructor(props: {
    width : number;
    height: number;
  }) {
    const { width, height } = props;
    
    this.renderTexture = RenderTexture.create({
      width,
      height,
    });
  }
}