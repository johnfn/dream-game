import { Graphics } from "pixi.js";
import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";
import { Grid } from "./library/tilemap";
import { C } from "./constants";
import { Game } from "./game";

export class Lighting extends Entity {
  activeModes = [GameMode.Normal];

  constructor(state: GameState) {
    super({
      collidable: false,
      dynamic   : false,
    });

    const g = new Graphics();

    g.beginFill(0x5d0015);
    g.drawPolygon([10, 10, 120, 100, 120, 200, 70, 200]);
    g.endFill();

    this.addChild(g);

    this.buildLighting(state);
  }

  // TODO: Use collision grid etc

  buildLighting(state: GameState) {
    type Point = { x: number, y: number };

    // Step 0: Get useful variables

    const player   = state.character;
    const map      = state.map;
    const entities = Game.Instance.entities.collidable;

    // Step 1: BFS to find bounds of current room.

    const playerGridX = Math.floor(player.x / C.TILE_WIDTH);
    const playerGridY = Math.floor(player.y / C.TILE_HEIGHT);

    let roomEdge: Point[] = [{ x: playerGridX, y: playerGridY }];
    const room = new Grid<boolean>();

    room.set(playerGridX, playerGridY, true);

    while (roomEdge.length > 0) {
      if (room.getCount() > 1000) {
        console.log("Maximum room flood size exceeded");

        break;
      }

      const current = roomEdge.pop()!;
      const dxdys = [
        [ 1, 0],
        [-1, 0],
        [ 0, 1],
        [ 0,-1],
      ];

      for (const [dx, dy] of dxdys) {
        const neighborX = current.x + dx;
        const neighborY = current.y + dy;

        if (room.get(neighborX, neighborY)) {
          continue;
        }

        let isWall = map.doesMapHaveCollisionAtTile(neighborX * C.TILE_WIDTH, neighborY * C.TILE_HEIGHT);

        if (isWall) {
          continue;
        }

        outer:
        for (const ent of entities) {
          // loop over entity grid points

          let xLow  = Math.floor(ent.x                / C.TILE_WIDTH);
          let yLow  = Math.floor(ent.y                / C.TILE_HEIGHT);
          let xHigh = Math.floor((ent.x + ent.width)  / C.TILE_WIDTH);
          let yHigh = Math.floor((ent.y + ent.height) / C.TILE_HEIGHT);

          for (let x = xLow; x < xHigh; x++) {
            for (let y = yLow; y < yHigh; y++) {
              if (x === neighborX && y === neighborY) {
                isWall = true;

                break outer;
              }
            }
          }
        }

        if (!isWall) {
          room.set(neighborX, neighborY, true);
          roomEdge.push({ x: neighborX, y: neighborY });
        }
      }
    }

    const g = new Graphics();

    g.beginFill(0xff0000, 0.1);

    for (const { x, y } of room.keys()) {
      g.drawRect(x * 32 + 8, y * 32 + 8, 8, 8);
    }

    // g.drawPolygon([10, 10, 120, 100, 120, 200, 70, 200]);

    g.endFill();

    this.addChild(g);

    console.log(room);
  }

  collide = () => {};

  update = (state: GameState) => { 

  };
}