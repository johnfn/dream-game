import { Graphics } from "pixi.js";
import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";
import { Grid } from "./library/tilemap";
import { C } from "./constants";
import { Game } from "./game";
import { Line } from "./library/line";
import { Vector2 } from "./library/vector2";
import { Hash, DefaultHash } from "./library/hash";

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

    // Step 0: Get useful variables!

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
        [ 1,  0],
        [-1,  0],
        [ 0,  1],
        [ 0, -1],
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

    // Step 2: Build lines for boundaries of the room.

    // Step 2a: Find all line segments of our boundaries.

    const segments: Line[] = [];

    for (const { x, y } of room.keys()) {
      // Step 2aa: Check our 4 neighbors and add segments according to the boundaries.

      if (!room.getOrDefault(x - 1, y, false)) {
        segments.push(new Line({ 
          x1: x * C.TILE_WIDTH, 
          y1: y * C.TILE_HEIGHT, 
          x2: x * C.TILE_WIDTH, 
          y2: y * C.TILE_HEIGHT + C.TILE_HEIGHT 
        }));
      }

      if (!room.getOrDefault(x + 1, y, false)) {
        segments.push(new Line({ 
          x1: x * C.TILE_WIDTH + C.TILE_HEIGHT, 
          y1: y * C.TILE_HEIGHT, 
          x2: x * C.TILE_WIDTH + C.TILE_HEIGHT, 
          y2: y * C.TILE_HEIGHT + C.TILE_HEIGHT 
        }));
      }

      if (!room.getOrDefault(x, y + 1, false)) {
        segments.push(new Line({ 
          x1: x * C.TILE_WIDTH, 
          y1: y * C.TILE_HEIGHT + C.TILE_HEIGHT, 
          x2: x * C.TILE_WIDTH + C.TILE_WIDTH, 
          y2: y * C.TILE_HEIGHT + C.TILE_HEIGHT,
        }));
      }

      if (!room.getOrDefault(x, y - 1, false)) {
        segments.push(new Line({ 
          x1: x * C.TILE_WIDTH, 
          y1: y * C.TILE_HEIGHT, 
          x2: x * C.TILE_WIDTH + C.TILE_WIDTH, 
          y2: y * C.TILE_HEIGHT,
        }));
      }
    }

    // Step 2b: Coalesce individual segments into full-length lines.

    // Step 2ba: Make a map of all segments that end at a given point. There are
    // always exactly 2.

    const segmentsAtPoint = new DefaultHash<Vector2, Line[]>(() => []);
    const hash = (vector: Vector2) => `${ vector.x }-${ vector.y }`;

    for (const edge of segments) {
      const { start, end } = edge;

      segmentsAtPoint.get(start).push(edge);
      segmentsAtPoint.get(end).push(edge);
    }

    debugger;

    // Step 2bb: Since all boundary lines are cycles, build the lines by walking
    // around the cycles.

    const boundaries: Line[] = [];
    let unprocessedSingleTileEdges = [...segments];

    const g = new Graphics();

    let xyz = 0.24;
    g.lineStyle(5, 0xff0000, 1);

    while (unprocessedSingleTileEdges.length > 0) {
      let potentialStart: Vector2;

      // Start with a vertex on a corner, so we make sure we don't start in the
      // middle of a line.

      let i = 0;

      do {
        if (i > unprocessedSingleTileEdges.length) {
          throw new Error("?HUH?");
        }

        potentialStart = unprocessedSingleTileEdges[i++].start;
      } while (
        segmentsAtPoint.get(potentialStart)[0].isXAligned() === 
        segmentsAtPoint.get(potentialStart)[1].isXAligned()
      );

      segmentsAtPoint.get(potentialStart)[0].drawOnto(g, 0xffff00);
      segmentsAtPoint.get(potentialStart)[1].drawOnto(g, 0xffff00);

      // Found a good vertex to start at, let's start building lines!

      let initialPositionOfPolygon = potentialStart;
      let initialPositionOfLine    = potentialStart;
      let currentPosition          = potentialStart;
      let currentSegment           = segmentsAtPoint.get(potentialStart)[0];
      let line                     = segmentsAtPoint.get(potentialStart)[0];
      const seenSegments           = [currentSegment];

      do {
        let nextPosition: Vector2;

        if (hash(currentPosition) !== hash(currentSegment.start)) {
          nextPosition = currentSegment.start;
        } else if (hash(currentPosition) !== hash(currentSegment.end)) {
          nextPosition = currentSegment.end;
        } else {
          throw new Error("???");
        }

        let nextSegment: Line;
        const potentialNextSegments = segmentsAtPoint.get(nextPosition);

        if (!currentSegment.equals(potentialNextSegments[0])) {
          nextSegment = potentialNextSegments[0];
        } else if (!currentSegment.equals(potentialNextSegments[1])) {
          nextSegment = potentialNextSegments[1];
        } else {
          throw new Error("?!?")
        }

        const effectiveBoundary = new Line({ one: initialPositionOfLine, two: nextPosition });

        if (!effectiveBoundary.isXAligned() && !effectiveBoundary.isYAligned()) {
          boundaries.push(line);
          initialPositionOfLine = currentPosition;
        } 

        line = new Line({
          one: initialPositionOfLine,
          two: nextPosition,
        });

        currentPosition = nextPosition;
        currentSegment  = nextSegment;

        seenSegments.push(currentSegment);
      } while (
        currentPosition.x !== initialPositionOfPolygon.x ||
        currentPosition.y !== initialPositionOfPolygon.y
      );

      boundaries.push(line);

      // Done, clear everything out of the unprocessed list. (TODO)

      for (const segment of seenSegments) {
        unprocessedSingleTileEdges = unprocessedSingleTileEdges.filter(unprocessedSegment => !unprocessedSegment.equals(segment));
      }
    }

    for (const boundary of boundaries) {
      boundary.drawOnto(g, 0xff0000);
    }

    this.addChild(g);
  }

  collide = () => {};

  update = (state: GameState) => { 

  };
}