import { Graphics } from "pixi.js";
import { Entity } from "./library/entity";
import { GameState, GameMode } from "./state";
import { Line } from "./library/line";
import { Vector2 } from "./library/vector2";
import { HashSet } from "./library/hash";
import { CollisionGrid } from "./collision_grid";
import { Pair } from "./library/pair";
import { ArbitrarySelection } from './library/arbitrary_selection'
import { Rect } from "./library/rect";
import { Debug } from "./library/debug";

export class LightSource extends Entity {
  activeModes = [GameMode.Normal];
  graphics    : Graphics;
  loggedOnce  = false;

  constructor() {
    super({
      collidable: false,
    });

    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }

  buildLighting(
    collisionGrid: CollisionGrid, 
    source       : Entity,

    // The furthest the light will go
    lightBounds  : Rect
  ): {
    graphics: Graphics;
    offsetX : number;
    offsetY : number;
  } {
    // Step -1: Clear out old state.

    this.graphics.clear();

    // Step 0: Get useful variables!

    const rects = new ArbitrarySelection();

    rects.addRect(lightBounds);

    const colliders = collisionGrid.getRectCollisions(lightBounds);

    for (const rect of colliders) {
      if (rect.firstEntity === source) { continue; }

      rects.subtractRect(rect.firstRect);
    }

    const allCollideableRects = rects.getOutlines();

    // for (const c of allCollideableRects) {
    //   for (const l of c) {
    //     Debug.DrawLine(l, 0xff0000);
    //     Debug.DrawPoint(l.start, 0xff0000);
    //     Debug.DrawPoint(l.end, 0xff0000);
    //   }
    // }

    // Step 3: We have all vertices, but that's actually too many. We should
    // only be considering all vertices that we have direct line of sight to.
    // Let's remove any vertices that we can't see.

    const allVisibleVertices = new HashSet<Vector2>();

    for (const boundary of allCollideableRects.flat()) {
      outer:
      for (const vertex of [boundary.start, boundary.end]) {
        // Let's see if this vertex is visible

        const rayToVertex = new Line({
          one: source.positionVector(),
          two: vertex,
        });

        // If it's blocked by any other boundary, it's not visible.

        for (const blockingBoundary of allCollideableRects.flat()) {
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
      const line = new Line({ one: source.positionVector(), two: vertex });

      anglesToVertices[line.angleInDegrees] = vertex;
    }

    const verticesSortedByAngle = Object.keys(anglesToVertices).map(s => Number(s)).sort((a, b) => a - b).map(angle => anglesToVertices[angle]);

    // Step 4: 
    // Now that we have visible vertices, potentially project the line PAST the
    // vertex it's on.

    const boundariesAndPoints: Pair<Line, Vector2>[][] = [];

    for (let i = 0; i < verticesSortedByAngle.length; i++) {
      const vertex = verticesSortedByAngle[i];

      const boundaryAndPoint: Pair<Line, Vector2>[] = allCollideableRects
        .flat()
        .filter(boundary => boundary.start.equals(vertex) || boundary.end.equals(vertex))
        .map(boundary => new Pair(boundary, vertex));

      const ray = new Vector2({ x: vertex.x - source.x, y: vertex.y - source.y });
      const nudgedVertex = ray.add(ray.normalize().multiply(3)).add(source.positionVector());

      const allHits = collisionGrid.collidesPoint(nudgedVertex);
      const hasObscuringHit = allHits.find(hit => !hit.firstEntity || (hit.firstEntity && !hit.firstEntity.transparent && hit.firstEntity !== source));

      if (!hasObscuringHit) {
        const veryLongV1 = ray.add(ray.normalize().multiply(1000));
        const longRaycast = new Line({
          one: source.positionVector(),
          two: source.positionVector().add(veryLongV1),
        });

        let closestBoundary : Line | null = null;
        let closestPoint    : Vector2 | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const boundary of allCollideableRects.flat()) {
          const collision = boundary.segmentIntersection(longRaycast);

          if (collision) {
            const distance = collision.distance(source.positionVector());

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
          const distance = pair.second.distance(source.positionVector());

          if (distance < closestBoundaryDistance) {
            closestBoundary = new Line({ one: pair.second, two: match.second });
            closestBoundaryDistance = distance;
          }
        }
      }

      if (closestBoundary) {
        polygons.push([
          [source.x               , source.y],
          [closestBoundary.start.x, closestBoundary.start.y],
          [closestBoundary.end.x  , closestBoundary.end.y],
          [source.x               , source.y],
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