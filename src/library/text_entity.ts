import { BaseTextEntity } from "./base_text_entity";

export type TextEntityStyle = {
  color   : string;
  fontSize: number;
  align  ?: "left" | "right";
}

export type TextStyles = {
  [key: string]: TextEntityStyle;
}

export type TextSegment = {
  text : string;
  style: TextEntityStyle;
}

enum TextSegmentState {
  NormalText,
  IdText,
  StyledText,
}

/**
 * Format: 
 * 
 * "%1%This is some red text% normal text %2%blue text!%".
 */
export class TextEntity extends BaseTextEntity {
  styles: TextStyles;

  /**
   * Format: 
   * 
   * "%1%This is some red text% normal text %2%blue text!%".
   */
  constructor(text: string, styles: TextStyles) {
    super("" , 500, 300);

    this.styles = styles;
    this.setText(text);
  }

  setText(text: string): void {
    const textSegments = this.buildTextSegments(text);

    const html = textSegments.map(segment => {
      return (
        `<span 
          style="
            color: ${ segment.style.color }; 
            font-family: FreePixel; 
            text-align: ${ segment.style.align || "left" }
            font-size: ${ segment.style.fontSize }px;"
        >${ segment.text }</span>`
      )
    }).join("").replace(/\n/g, "");

    this.html = html;
  }

  buildTextSegments(text: string): TextSegment[] {
    let i = 0;
    const readChar = () => text[i++];
    let state = TextSegmentState.NormalText;

    const segments: TextSegment[] = [{
      text: "",
      style: {
        color   : "black",
        fontSize: 18
      },
    }];

    let id = "";

    while (i < text.length) {
      const ch = readChar();

      if (ch === "%") {
        if (state === TextSegmentState.NormalText) {
          state = TextSegmentState.IdText;
          id = "";
        } else if (state === TextSegmentState.IdText) {
          state = TextSegmentState.StyledText;

          segments.push({
            text: "",
            style: this.styles[id],
          });
        } else if (state === TextSegmentState.StyledText) {
          state = TextSegmentState.NormalText;

          segments.push({
            text: "",
            style: {
              color   : "black",
              fontSize: 18
            },
          });
        }
        
        continue;
      } else {
        if (state === TextSegmentState.NormalText) {
          segments[segments.length - 1].text += ch;
        } else if (state === TextSegmentState.IdText) {
          id += ch;
        } else if (state === TextSegmentState.StyledText) {
          segments[segments.length - 1].text += ch;
        }
      }
    } 

    return segments.filter(segment => segment.text.trim() !== "");
  }

  // public set width(value: number) {
  //   this.sprite.width = value;
  //   // this.buildTextGraphic();
  // }

  // public set height(value: number) {
  //   this.sprite.width = value;
  //   // this.buildTextGraphic();
  // }

}