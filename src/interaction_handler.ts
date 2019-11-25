import { Container } from "pixi.js";
import { InteractableEntity } from "./library/interactable_entity";
import { Vector2 } from "./library/vector2";
import { GameState } from "./state";
import { InteractiveText } from "./entities/interactive_text";
import { HashSet } from "./library/hash";

export class InteractionHandler {
  stage: Container;
  interactText: InteractiveText;

  constructor(stage: Container) {
    this.stage = stage;

    this.interactText = new InteractiveText();
    this.stage.addChild(this.interactText);
  }

  update(props: {
    activeEntities: HashSet<InteractableEntity>;
    gameState     : GameState;
  }) {
    const { activeEntities, gameState } = props;
    const { character } = gameState;

    // find potential interactor

    const sortedInteractors = activeEntities
      .values()
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

    const sortedInteractorsWithMode = sortedInteractors
      .filter(ent => ent.activeModes.includes(gameState.mode))

    let targetInteractor: InteractableEntity | null = sortedInteractorsWithMode[0];

    // Found it. interact

    if (targetInteractor && gameState.keys.justDown.E) {
      targetInteractor.interact(character, gameState);
    }

    // We relax our restrictions for showing text a little
    // It doesn't make sense for interaction text to disappear while dialog is shown.

    let targetInteractorText: InteractableEntity | null = sortedInteractors[0];

    // update HUD (maybe move this code into HUD)

    if (targetInteractorText) {
      this.interactText.visible = true;
      this.interactText.setTarget(targetInteractorText);

      this.interactText.setText(`%1%${ targetInteractorText.interactText(gameState) }`);
    } else {
      this.interactText.visible = false;
      this.interactText.setText(`%1%`);
    }
  };
}