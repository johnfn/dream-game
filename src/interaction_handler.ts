import { Container } from "pixi.js";
import { InteractableEntity } from "./library/interactable_entity";
import { Vector2 } from "./library/vector2";
import { GameState } from "./state";

export class InteractionHandler {
  stage: Container;

  constructor(stage: Container) {
    this.stage = stage;
  }

  update(props: {
    activeEntities: InteractableEntity[];
    gameState     : GameState;
  }) {
    const { activeEntities, gameState } = props;
    const { character, hud } = gameState;

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
      hud.interactText.setText(`%1%e: ${ targetInteractor.interactText() }`);
    } else {
      hud.interactText.setText(`%1%e: Nothing`);
    }
  };
}