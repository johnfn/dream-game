import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";
import { TextEntity } from "./library/text_entity";
import { TextureEntity } from "./texture_entity";
import { C } from "./constants";

export class HeadsUpDisplay extends Entity {
  activeModes = [GameMode.Normal];
  interactText: TextEntity;
  keyIcon     : Entity;
  keyText     : TextEntity;

  constructor() {
    super({
      collidable: false,
    });

    this.interactText = new TextEntity(
      "%1%e: Nothing", {
        1: { color   : "white", fontSize: 18, align: "right" }
      }
    );

    this.interactText.x = 500;
    this.interactText.y = 0;

    this.addChild(this.interactText);

    this.keyIcon = new TextureEntity({
      texture: C.Loader.getResource("art/key.png").texture,
    });

    this.keyIcon.x = 0;
    this.keyIcon.y = C.CANVAS_HEIGHT - 50;

    this.addChild(this.keyIcon);

    this.keyText = new TextEntity(
      "%1%0", {
        1: { color: "white", fontSize: 24, align: "left" }
      }
    );

    this.keyText.x = 30;
    this.keyText.y = this.keyIcon.y - 4;

    this.addChild(this.keyText);
  }

  interact = () => {};

  collide = () => {};

  update = (state: GameState) => {
    this.keyText.setText(`%1%${ state.keyCount }`);
  };
}
