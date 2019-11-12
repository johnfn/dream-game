import { Sprite, Texture } from 'pixi.js';
import { FontDataUrl } from './font_data_url';

export const PIXEL_RATIO = (() => {
  const ctx = document.createElement("canvas").getContext("2d")!,
      dpr = window.devicePixelRatio || 1,
      bsr = (ctx as any).webkitBackingStorePixelRatio ||
            (ctx as any).mozBackingStorePixelRatio ||
            (ctx as any).msBackingStorePixelRatio ||
            (ctx as any).oBackingStorePixelRatio ||
            (ctx as any).backingStorePixelRatio || 1;

  return dpr / bsr;
})();
    
export class TextEntity extends Sprite {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor() {
    super();

    this.width = 500;
    this.height = 500;
    this.canvas = this.createHiDPICanvas(this.width, this.height);
    this.context = this.canvas.getContext('2d')!;

    this.buildText();
  }

  // converting woff into dataurl:
  // https://gist.github.com/viljamis/c4016ff88745a0846b94

  // reference used for this insanity: 
  // https://stackoverflow.com/questions/12652769/rendering-html-elements-to-canvas

  async renderHTMLToCanvas(html: string, ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    var data = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="${ width }" height="${ height }">
      <foreignObject width="100%" height="100%">
        <defs>
          <style type="text/css">
            @font-face {
              font-family: FreePixel;
              src: url('${ FontDataUrl }');
            }
          </style>
        </defs>
      ${ this.htmlToXML(html) }
      
      </foreignObject>
    </svg>`;

    await new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = function() {
        ctx.drawImage(img, x, y);

        resolve();
      }

      img.src = data;
    });
  }

  htmlToXML(html: string): string {
    var doc = document.implementation.createHTMLDocument('');
    doc.write(html);

    // You must manually set the xmlns if you intend to immediately serialize     
    // the HTML document to a string as opposed to appending it to a
    // <foreignObject> in the DOM
    doc.documentElement.setAttribute('xmlns', doc.documentElement.namespaceURI!);

    // Get well-formed markup
    html = (new XMLSerializer).serializeToString(doc.body);

    return html;
  }

  createHiDPICanvas(w: number, h: number, ratio: number | undefined = undefined) {
    if (ratio === undefined) { 
      ratio = PIXEL_RATIO; 
    }
    
    const can = document.createElement("canvas");

    can.width        = w * ratio;
    can.height       = h * ratio;
    can.style.width  = w + "px";
    can.style.height = h + "px";

    can.getContext("2d")!.setTransform(ratio, 0, 0, ratio, 0, 0);

    return can;
  }

  async buildText() {
    this.context.clearRect(0, 0, this.width, this.height);

    const html = `
      <div style="color: red; font-family: FreePixel; font-size: 18px">this works. don't ask how.</div>
    `;

    await this.renderHTMLToCanvas(html, this.context, 0, 0, this.width, this.height);

    this.texture = Texture.from(this.canvas)
  }
}
