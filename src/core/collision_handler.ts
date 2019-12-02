import { GameState } from "../state";
import { CollisionGrid } from "../collision_grid";
import { C } from "../constants";
import { MovingEntity } from "../library/moving_entity";
import { EntityType } from "../library/entity";
import { Vector2 } from "../library/vector2";

export class CollisionHandler {
  buildCollisionGrid = (state: GameState): CollisionGrid => {
    const { camera } = state;

    const collideableEntities = state.getCollideableEntities();

    const grid = new CollisionGrid({
      width   : 2 * C.CANVAS_WIDTH,
      height  : 2 * C.CANVAS_HEIGHT,
      cellSize: 8 * C.TILE_WIDTH,
      debug   : false,
    });

    for (const entity of collideableEntities.values()) {
      if (entity.collisionBounds(state).intersects(camera.bounds())) {
        grid.addRectGroup(entity.collisionBounds(state), entity);
      }
    }

    const mapColliders = state.map.collisionBounds(state);
    
    for (const mapCollider of mapColliders.getRects()) {
      grid.add(mapCollider, state.map);
    }

    return grid;
  };

  resolveCollisions = (state: GameState, grid: CollisionGrid) => {
    const collideableEntities = state.getCollideableEntities();

    const movingEntities: MovingEntity[] = collideableEntities.values().filter(
      ent => ent.entityType === EntityType.MovingEntity && ent.activeModes.includes(state.mode)
    ) as MovingEntity[];

    for (const entity of movingEntities) {
      if (entity.velocity.x === 0 && entity.velocity.y === 0) { continue; }

      let updatedBounds = entity.collisionBounds(state);

      const xVelocity = new Vector2({ x: entity.velocity.x, y: 0 });
      const yVelocity = new Vector2({ x: 0, y: entity.velocity.y });

      let delta = Vector2.Zero;

      // resolve x-axis

      delta = delta.add(xVelocity);
      updatedBounds = updatedBounds.add(xVelocity);

      if (grid.getRectGroupCollisions(updatedBounds, entity).length > 0) {
        delta = delta.subtract(xVelocity);
        updatedBounds = updatedBounds.subtract(xVelocity);
      }

      // resolve y-axis

      delta = delta.add(yVelocity);
      updatedBounds = updatedBounds.add(yVelocity);

      if (grid.getRectGroupCollisions(updatedBounds, entity).length > 0) {
        delta = delta.subtract(yVelocity);
        updatedBounds = updatedBounds.subtract(yVelocity);
      }

      entity.x = entity.x + delta.x;
      entity.y = entity.y + delta.y;
    }
  };
}