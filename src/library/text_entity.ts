import { BaseTextEntity } from "./base_text_entity";

export type TextEntityStyle = {
  color   : string;
  fontSize: number;
  align  ?: "left" | "right" | "center";
}

export type TextStyles = {
  [key: string]: TextEntityStyle;
}

export type TextSegment = {
  text : string;
  style: TextEntityStyle;
}

export enum TextSegmentState {
  NormalText,
  IdText,
  StyledText,
}

export const AdvanceState = (currentState: TextSegmentState): TextSegmentState => {
  if (currentState === TextSegmentState.NormalText) {
    return TextSegmentState.IdText;
  } else if (currentState === TextSegmentState.IdText) {
    return TextSegmentState.StyledText;
  } else if (currentState === TextSegmentState.StyledText) {
    return TextSegmentState.NormalText;
  }

  return undefined as any; // stupid typechecker
}

/**
 * Format: 
 * 
 * "%1%This is some red text% normal text %2%blue text!%".
 */
export class TextEntity extends BaseTextEntity {
  styles: TextStyles;

  public static StandardStyles: TextStyles = {
    1: { color: "white", fontSize: 18, align: "left" },
    2: { color: "red"  , fontSize: 18, align: "left" },
  };

  /**
   * Format: 
   * 
   * "%1%This is some red text% normal text %2%blue text!%".
   */
  constructor(text: string, styles: TextStyles = TextEntity.StandardStyles, width = 500, height = 300) {
    super("" , width, height);

    this.styles = styles;
    this.setText(text);
  }

  setText(text: string): void {
    if (text === "") {
      this.html = "";

      return;
    }

    const textSegments = this.buildTextSegments(text);

    const html = textSegments.map(segment => {
      return (
        `<div 
          style="
            color: ${ segment.style.color }; 
            font-family: FreePixel; 
            text-align: ${ segment.style.align || "left" };
            font-size: ${ segment.style.fontSize }px;"
        >${ segment.text }</div>`
      );
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
          id = "";
        } else if (state === TextSegmentState.IdText) {
          segments.push({
            text: "",
            style: this.styles[id],
          });
        } else if (state === TextSegmentState.StyledText) {
          segments.push({
            text: "",
            style: {
              color   : "black",
              fontSize: 18
            },
          });
        }

        state = AdvanceState(state);
        
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