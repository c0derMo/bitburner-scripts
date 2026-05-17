interface TextTransform {
  Type: string;
  Value: number;
}

type Color =
  | "Black"
  | "Red"
  | "Green"
  | "Yellow"
  | "Blue"
  | "Magenta"
  | "Cyan"
  | "White";
type Transform = "Bold" | "Underline";

export class TextTransforms {
  //https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_(Select_Graphic_Rendition)_parameters
  static #escapeCode = "\x1b[";
  static #foreground = "38;5;";
  static #background = "48;5;";
  static #endCode = "m";
  static #reset = `${this.#escapeCode}0${this.#endCode}`;
  static Highlight = {
    Black: { Type: "Highlight", Value: 16 },
    Red: { Type: "Highlight", Value: 52 },
    Green: { Type: "Highlight", Value: 22 },
    Yellow: { Type: "Highlight", Value: 58 },
    Blue: { Type: "Highlight", Value: 17 },
    Magenta: { Type: "Highlight", Value: 53 },
    Cyan: { Type: "Highlight", Value: 30 },
    White: { Type: "Highlight", Value: 231 },
  } as Record<Color, TextTransform>;
  static Color = {
    Black: { Type: "Color", Value: 16 },
    Red: { Type: "Color", Value: 52 },
    Green: { Type: "Color", Value: 22 },
    Yellow: { Type: "Color", Value: 58 },
    Blue: { Type: "Color", Value: 17 },
    Magenta: { Type: "Color", Value: 53 },
    Cyan: { Type: "Color", Value: 30 },
    White: { Type: "Color", Value: 231 },
  } as Record<Color, TextTransform>;
  static Transform = {
    Bold: { Type: "Transform", Value: 1 },
    Underline: { Type: "Transform", Value: 4 },
  } as Record<Transform, TextTransform>;

  /** Apply xTerm Text Modifications
	 @param {string} text
	 @param {any[]} transforms
	*/
  static apply(text: string, transforms: TextTransform[]): string {
    const prefix = [];
    const code = [];
    let apply = "";

    for (const transform of transforms) {
      if (transform.Type != undefined && Number.isFinite(transform.Value)) {
        if (transform.Type === "Highlight") {
          code.push(`${this.#background}${transform.Value};`);
        } else if (transform.Type === "Transform") {
          prefix.push(`${transform.Value};`);
        } else if (transform.Type === "Color") {
          code.push(`${this.#foreground}${transform.Value};`);
        }
      }
    }
    if (prefix.length > 0) {
      apply += prefix.join("");
    }
    if (code.length > 0) {
      apply += code.join("");
    }
    if (apply.length > 0) {
      apply = `${this.#escapeCode}${apply}${this.#endCode}`;
    }

    apply += `${text}${this.#reset}`;

    return `${apply}`;
  }
}
