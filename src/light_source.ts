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
import { Pair } from "./library/pair";

export class LightSource extends Entity {
  activeModes = [GameMode.Normal];
  graphics: Graphics;
  loggedOnce = false;

  constructor() {
    super({
      collidable: false,
    });

    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }

  buildLighting(state: GameState, collisionGrid: CollisionGrid): {
    graphics: Graphics;
    offsetX : number;
    offsetY : number;
  } {
    // Step -1: Clear out old state.

    this.graphics.clear();

    // Step 0: Get useful variables!

    const player       = state.character;
    const camera       = state.camera;
    const cameraBounds = camera.bounds();

    // The furthest the light will go
    const lightBounds  = cameraBounds.expand(100);

    // Step 1: BFS to find bounds of current room.

    const playerGridX = Math.floor(player.x / C.TILE_WIDTH);
    const playerGridY = Math.floor(player.y / C.TILE_HEIGHT);

    let roomEdge: Vector2[] = [new Vector2({ x: playerGridX, y: playerGridY })];
    const room = new Grid<boolean>();

    room.set(playerGridX, playerGridY, true);

    let count = 0;
    while (roomEdge.length > 0) {
      if (count++ > 1000) {
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

        const nextTile = new Rect({
          x: neighborX * C.TILE_WIDTH + 1,
          y: neighborY * C.TILE_HEIGHT + 1,
          w: C.TILE_WIDTH - 2,
          h: C.TILE_HEIGHT - 2,
        });

        if (!lightBounds.intersects(nextTile)) {
          continue;
        }

        const hits = collisionGrid.collidesRect(nextTile, player);
        const isObscured = hits.filter(hit => {
          return (
            hit.firstEntity && !hit.firstEntity.transparent &&
            hit.secondEntity && !hit.secondEntity.transparent
          );
        }).length;

        if (!isObscured) {
          room.set(neighborX, neighborY, true);
          roomEdge.push(new Vector2({ x: neighborX, y: neighborY }));
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

      // Done, clear everything out of the unprocessed list.
      // TODO: This is actually n^2, even though it doesn't have to be.

      const seenSegmentHash = new HashSet(seenSegments);

      unprocessedSingleTileEdges = unprocessedSingleTileEdges.filter(unprocessedSegment => !seenSegmentHash.get(unprocessedSegment));
    }

    // Step 3: We have all vertices, but that's actually too many. We should
    // only be considering all vertices that we have direct line of sight to.
    // Let's remove any vertices that we can't see.

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

        for (const blockingBoundary of boundaries) {
          if (!blockingBoundary.sharesAVertexWith(rayToVertex)) {
            const intersection = blockingBoundary.segmentIntersection(rayToVertex);

            if (intersection) {
              continue outer;
            }
          }
        }

        allVisibleVertices.put(vertex);
      }
    }

    const anglesToVertices: {[angle: number]: Vector2 } = {};

    for (const vertex of allVisibleVertices.values()) {
      const line = new Line({ one: player.positionVector(), two: vertex });

      anglesToVertices[line.angleInDegrees] = vertex;
    }

    const verticesSortedByAngle = Object.keys(anglesToVertices).map(s => Number(s)).sort((a, b) => a - b).map(angle => anglesToVertices[angle]);

    // Step 4: 
    // Now that we have visible vertices, potentially project the line PAST the
    // vertex it's on.

    const boundariesAndPoints: Pair<Line, Vector2>[][] = [];

    for (let i = 0; i < verticesSortedByAngle.length; i++) {
      const vertex = verticesSortedByAngle[i];

      const boundaryAndPoint: Pair<Line, Vector2>[] = boundaries
        .filter(boundary => boundary.start.equals(vertex) || boundary.end.equals(vertex))
        .map(boundary => new Pair(boundary, vertex));

      const ray = new Vector2({ x: vertex.x - player.x, y: vertex.y - player.y });
      const nudgedVertex = ray.add(ray.normalize().multiply(3)).add(player.positionVector());

      if (collisionGrid.collidesPoint(nudgedVertex).length === 0) {
        const veryLongV1 = ray.add(ray.normalize().multiply(1000));
        const longRaycast = new Line({
          one: player.positionVector(),
          two: player.positionVector().add(veryLongV1),
        });

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
          boundaryAndPoint.push(new Pair(closestBoundary, closestPoint))
        }
      }

      boundariesAndPoints.push(boundaryAndPoint);
    }

    // Step 5bb:

    // Now that we have all visible vertices, spin in a circle, drawing a ray to
    // (and potentially through!) each one. Find the (closest!) boundary line
    // that joins the two rays - those three lines make up a polygon of the
    // light raycast.

    let polygons: [number, number][][] = [];

    for (let i = 0; i < boundariesAndPoints.length; i++) {
      const ray1 = boundariesAndPoints[i];
      const ray2 = boundariesAndPoints[(i + 1) % boundariesAndPoints.length];

      let closestBoundary: Line | null = null;
      let closestBoundaryDistance = Number.POSITIVE_INFINITY;

      for (const pair of ray1) {
        const match = ray2.find(secondPair => secondPair.first.getOverlap(pair.first));

        if (match) {
          const distance = pair.second.distance(player.positionVector());

          if (distance < closestBoundaryDistance) {
            closestBoundary = new Line({ one: pair.second, two: match.second });
            closestBoundaryDistance = distance;
          }
        }
      }

      if (closestBoundary) {
        polygons.push([
          [player.x               , player.y],
          [closestBoundary.start.x, closestBoundary.start.y],
          [closestBoundary.end.x  , closestBoundary.end.y],
          [player.x               , player.y],
        ])
      } else {
        // TODO: this happens when two vertices perfectly line up

        if (!this.loggedOnce) {
          this.loggedOnce = true;
          console.log("grant still hasnt fixed the lighting edgecase");
        }
      }
    }

    // offset polygons and graphics so that we dont draw at negative coordinates.

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;

    for (const polygon of polygons) {
      for (const [x, y] of polygon) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
      }
    }

    for (const polygon of polygons) {
      const verts = polygon.flatMap(([x, y]) => [x - minX, y - minY]);

      this.graphics.beginFill(0xFFFFFF);
      this.graphics.lineStyle(0, 0, 0);
      this.graphics.drawPolygon(verts);
      this.graphics.endFill();
    }

    return {
      graphics: this.graphics,
      offsetX : minX,
      offsetY : minY,
    };
  }

  collide = () => {};

  update = (state: GameState) => { 

  };
}