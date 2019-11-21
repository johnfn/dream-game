import { Graphics } from "pixi.js";
import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";
import { C } from "./constants";
import { Line } from "./library/line";
import { Vector2 } from "./library/vector2";
import { DefaultHashMap, HashSet } from "./library/hash";
import { Grid } from "./library/grid";
import { CollisionGrid } from "./collision_grid";
import { Rect } from "./library/rect";
import { Debug } from "./library/debug";
import { Pair } from "./library/pair";

export class LightSource extends Entity {
  activeModes = [GameMode.Normal];
  graphics: Graphics;

  constructor(state: GameState, collisionGrid: CollisionGrid) {
    super({
      collidable: false,
      dynamic   : false,
    });

    this.graphics = new Graphics();
    this.graphics.beginFill(0x5d0015);
    this.graphics.drawPolygon([10, 10, 120, 100, 120, 200, 70, 200]);
    this.graphics.endFill();

    this.addChild(this.graphics);

    this.buildLighting(state, collisionGrid);
  }

  debugDrawRoom(room: Grid<boolean>) {
    for (const { x, y } of room.keys()) {
      this.graphics.drawRect(
        x * C.TILE_WIDTH,
        y * C.TILE_HEIGHT,
        C.TILE_WIDTH,
        C.TILE_HEIGHT
      );
    }
  }

  buildLighting(state: GameState, collisionGrid: CollisionGrid) {
    // Step -1: Clear out old state.

    this.graphics.clear();

    // Step 0: Get useful variables!

    const player   = state.character;

    // Step 1: BFS to find bounds of current room.

    const playerGridX = Math.floor(player.x / C.TILE_WIDTH);
    const playerGridY = Math.floor(player.y / C.TILE_HEIGHT);

    let roomEdge: Vector2[] = [new Vector2({ x: playerGridX, y: playerGridY })];
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

        const isWall = collisionGrid.collidesRect(new Rect({
          x: neighborX * C.TILE_WIDTH,
          y: neighborY * C.TILE_HEIGHT,
          w: C.TILE_WIDTH,
          h: C.TILE_HEIGHT,
        }).shrink(1), player);

        if (isWall.length === 0) {
          room.set(neighborX, neighborY, true);
          roomEdge.push(new Vector2({ x: neighborX, y: neighborY }));
        }
      }
    }

    this.debugDrawRoom(room);

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

    const segmentsAtPoint = new DefaultHashMap<Vector2, Line[]>(() => []);
    const hash = (vector: Vector2) => `${ vector.x }-${ vector.y }`;

    for (const edge of segments) {
      const { start, end } = edge;

      segmentsAtPoint.get(start).push(edge);
      segmentsAtPoint.get(end).push(edge);
    }

    // Step 2bb: Since all boundary lines are cycles, build the lines by walking
    // around the cycles.

    const boundaries: Line[] = [];
    let unprocessedSingleTileEdges = [...segments];

    this.graphics.lineStyle(5, 0xff0000, 1);

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

      segmentsAtPoint.get(potentialStart)[0].drawOnto(this.graphics, 0xffff00);
      segmentsAtPoint.get(potentialStart)[1].drawOnto(this.graphics, 0xffff00);

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

    // Step 3: We have all vertices, but that's actually too many. We should
    // only be considering all vertices that we have direct line of sight to.
    // Let's remove any vertices that we can't see.

    // const allVertices = new HashSet<Vector2>();

    // for (const boundary of boundaries) {
    //   allVertices.put(boundary.start);
    //   allVertices.put(boundary.end);
    // }

    const allVisibleVertices = new HashSet<Vector2>();

    for (const boundary of boundaries) {
      outer:
      for (const vertex of [boundary.start, boundary.end]) {
        // Let's see if this vertex is visible

        const rayToVertex = new Line({
          one: player.positionVector(),
          two: vertex,
        });

        // If it's blocked by any other boundary, it's not visible.

        let visible = true;

        for (const blockingBoundary of boundaries) {
          if (!blockingBoundary.sharesAVertexWith(rayToVertex)) {
            const intersection = blockingBoundary.segmentIntersection(rayToVertex);

            if (intersection) {
              continue outer;
            }
          }
        }

        if (visible) {
          allVisibleVertices.put(vertex);
        }
      }
    }

    const anglesToVertices: {[angle: number]: Vector2 } = {};

    for (const vertex of allVisibleVertices.values()) {
      const line = new Line({ one: player.positionVector(), two: vertex });

      // allVerticesByAngle[line.angleInDegrees] = (allVerticesByAngle[line.angleInDegrees] || []).concat(vertex);
      anglesToVertices[line.angleInDegrees] = vertex;
    }

    const verticesSortedByAngle = Object.keys(anglesToVertices).map(s => Number(s)).sort().map(angle => anglesToVertices[angle]);

    // Step 4; Now that we have visible vertices, potentially project the line PAST
    // the vertex it's on. 

    const boundariesAndPoints: Pair<Line, Vector2>[][] = [];

    for (let i = 0; i < verticesSortedByAngle.length; i++) {
      const vertex = verticesSortedByAngle[i];

      const boundaryAndPoint: Pair<Line, Vector2>[] = boundaries
        .filter(boundary => boundary.start.equals(vertex) || boundary.end.equals(vertex))
        .map(boundary => new Pair(boundary, vertex));

      const ray1 = new Vector2({ x: vertex.x - player.x, y: vertex.y - player.y });
      const nudgedVertex = ray1.add(ray1.normalize().multiply(3)).add(player.positionVector());

      if (collisionGrid.collidesPoint(nudgedVertex).length === 0) {
        const veryLongV1 = ray1.add(ray1.normalize().multiply(1000));
        const longRaycast = new Line({
          one: player.positionVector(),
          two: player.positionVector().add(veryLongV1),
        });
        Debug.DrawLine(longRaycast)
        let closestBoundary : Line | null = null;
        let closestPoint    : Vector2 | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const boundary of boundaries) {
          const collision = boundary.segmentIntersection(longRaycast);

          if (collision) {
            const distance = collision.distance(player.positionVector());

            if (distance < closestDistance) {
              if (boundaryAndPoint.find(pair => pair.first.equals(boundary)) === undefined) {
                closestDistance = distance;
                closestBoundary = boundary;
                closestPoint    = collision;
              }
            }
          }
        }

        if (closestPoint && closestBoundary) {
        //   Debug.DrawLine(closestBoundary, 0xffff00);
        //   Debug.DrawPoint(closestPoint, 0xffff00);

          boundaryAndPoint.push(new Pair(closestBoundary, closestPoint))
        }
      }

      boundariesAndPoints.push(boundaryAndPoint);
    }

    for (const points of boundariesAndPoints) {
      for (const { first, second } of points) {
        Debug.DrawPoint(second);
        Debug.DrawLine(new Line({ 
          one: player.positionVector(),
          two: second,
        }));
      }
    }

    // const v2 = verticesSortedByAngle[(i + 1) % verticesSortedByAngle.length];

    // Step 4:

    // Now that we have all visible vertices, spin in a circle, drawing a ray to
    // (and potentially through!) each one. Find the (closest!) boundary line
    // that joins the two rays - those three lines make up a polygon of the
    // light raycast.

    // Find all boundaries that this line touches
    // Find all boundaries that the next line touches
    // Take the closest one

    /*
    for (const list of Object.values(allVerticesByAngle)) {

      outer:
      for (const v of list) {
        const line = new Line({ one: player.positionVector(), two: v });

        for (const boundary of boundaries) {
          if (line.intersects(boundary) && !line.equals(boundary) && (
            !line.start.equals(boundary.start) &&
            !line.start.equals(boundary.end) &&
            !line.end.equals(boundary.start) &&
            !line.end.equals(boundary.end)
          )) {
            continue outer;
          }
        }

        line.drawOnto(this.graphics, 0xff0000);
      }
    }
    */

  }

  collide = () => {};

  update = (state: GameState) => { 

  };
}