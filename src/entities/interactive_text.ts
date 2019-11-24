import { TextEntity } from "../library/text_entity";
import { Entity } from "../library/entity";
import { GameMode } from "../state";

export class InteractiveText extends Entity {
  activeModes = [GameMode.Dialog, GameMode.Normal];
  private _text: TextEntity;
  private _tick = 0;

  constructor() {
    super({ 
      collidable: false,
    });

    this._text = new TextEntity("%1%Interact aaa", {
      1: { color: "white", fontSize: 24, align: "center" }
    }, 200, 300);

    this.addChild(this._text);
  }

  setTarget(target: Entity): void {
    this.x = target.x - 200 / 2 + target.width / 2;
    this.y = target.y - 30;
  }

  setText(newText: string): void {
    this._text.setText(newText);
  }

  collide = () => {};
  update  = () => {
    this._text.y = Math.sin(this._tick++ / 20) * 5 - 10;
  };
}