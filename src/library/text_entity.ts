import { BaseTextEntity } from "./base_text_entity";

export type TextEntityStyle = {
  color   : string;
  fontSize: number;
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
  constructor(text: string, styles: TextStyles) {
    super("" , 500, 300);

    const textSegments = this.buildTextSegments(text, styles);

    const html = textSegments.map(segment => {
      return (
        `<span style="color: ${ segment.style.color }; font-family: FreePixel; font-size: ${ segment.style.fontSize }px;">${ segment.text }</span>`
      )
    }).join("");

    console.log(html);

    this.html = html;
  }

  buildTextSegments(text: string, styles: TextStyles): TextSegment[] {
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
            style: styles[id],
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
}