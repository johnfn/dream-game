import { Container } from "pixi.js";
import { InteractableEntity } from "./library/interactable_entity";
import { Vector2 } from "./library/vector2";
import { GameState } from "./state";
import { InteractiveText } from "./entities/interactive_text";

export class InteractionHandler {
  stage: Container;
  interactText: InteractiveText;

  constructor(stage: Container) {
    this.stage = stage;

    this.interactText = new InteractiveText();
    this.stage.addChild(this.interactText);
  }

  update(props: {
    activeEntities: InteractableEntity[];
    gameState     : GameState;
  }) {
    const { activeEntities, gameState } = props;
    const { character } = gameState;

    // find potential interactor

    const sortedInteractors = activeEntities
      .filter(ent => ent.canInteract() && new Vector2(ent.position).diagonalDistance(character.positionVector()) < ent.interactRange)
      .slice()
      .sort(
        (a, b) =>
          new Vector2(a.position).diagonalDistance(
            new Vector2(character.position)
          ) -
          new Vector2(b.position).diagonalDistance(
            new Vector2(character.position)
          )
      );

    let targetInteractor: InteractableEntity | null = sortedInteractors[0];

    // found it. interact

    if (targetInteractor && gameState.keys.justDown.E) {
      targetInteractor.interact(character, gameState);
    }

    // update HUD (maybe move this code into HUD)

    if (targetInteractor) {
      this.interactText.visible = true;
      this.interactText.setTarget(targetInteractor);

      this.interactText.setText(`%1%${ targetInteractor.interactText() }`);
    } else {
      this.interactText.visible = false;
      this.interactText.setText(`%1%`);
    }
  };
}