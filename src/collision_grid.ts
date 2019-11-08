import * as PIXI from "pixi.js";
import { Rect } from "./library/rect";
import { Entity } from "./entity";
import { Line } from "./library/line";
import { C } from "./constants";
import { Game } from "./game";
import { Point } from "./library/point";

export class CollisionGrid {
  private _position: Point = Point.Zero;
  private _game: Game;
  private _width: number;
  private _height: number;
  private _cellSize: number;
  private _numCellsPerRow: number;
  private _numCellsPerCol: number;
  private _cells: { [index: number]: Cell } = {};
  private _target: Entity | undefined;

  constructor(props: {
    game: Game;
    width: number;
    height: number;
    cellSize: number;
    debug: boolean;
  }) {
    const { game, width, height, cellSize, debug } = props;
    this._game = game;
    this._width = width;
    this._height = height;
    this._cellSize = cellSize;

    this._numCellsPerRow = Math.floor(width / cellSize);
    this._numCellsPerCol = Math.floor(height / cellSize);

    // Initialize cells
    for (let x = 0; x < this._numCellsPerRow; x++) {
      for (let y = 0; y < this._numCellsPerCol; y++) {
        const pos = new Point({
          x: x * cellSize,
          y: y * cellSize
        });
        const hash = this.hashPosition(pos);
        this._cells[hash] = new Cell(pos, cellSize);
      }
    }

    if (debug) this.drawGrid();
  }

  public get topLeft() {
    return this._position;
  }

  public get center() {
    return this._position.add({x: this._width/2, y: this._height/2})
  }

  checkCollisions = (entities: Entity[]) => {
    
    this.clear();

    for (let e of entities) {
      if (e.isOnScreen()) this.add(e);
    }

    // Check for collisions using grid
    for (let cell of this.cells) {
      const cellEntities = cell.entities;
      for (let i = 0; i < cellEntities.length; i++) {
        for (let j = i; j < cellEntities.length; j++) {
          if (i === j) continue;

          const ent1 = cellEntities[i];
          const ent2 = cellEntities[j];
          const bounds1: Rect = ent1.bounds;
          const bounds2: Rect = ent2.bounds;

          const intersection = bounds1.getIntersection(bounds2, false);

          if (!!intersection) {
            ent1.collide(ent2, intersection);
            ent2.collide(ent1, intersection);
          }
        }
      }
    }
  }

  // Computes the hash of a position, which corresponds to a single cell in the grid.
  hashPosition = (pos: Point): number => {
    return (
      113 * Math.floor(pos.x / this._cellSize) +
      Math.pow(113, 2) * Math.floor(pos.y / this._cellSize)
    );
  };

  // Hashes each corner of a Rect.
  hashCorners = (rect: Rect): number[] => {
    const hashes: number[] = [];
    for (let corner of rect.getPointsFromRect()) {
      hashes.push(this.hashPosition(corner));
    }
    return hashes;
  };

  public get cells(): Cell[] {
    return Object.values(this._cells);
  }

  clear = () => {
    const keys = Object.keys(this._cells);
    for (let i = 0; i < keys.length; i++) {
      const key: number = Number(keys[i]);
      this._cells[key].removeAll();
    }
  };

  follow(e: Entity) {
    this._target = e;
  }
  // Add an entity to the hash grid.
  // Checks each corner, to handle entities that span multiply grid cells.
  add = (e: Entity) => {
    // Remove duplicate hashes
    const hashes = Array.from(new Set(this.hashCorners(e.bounds)));
    for (let hash of hashes) {
      if (!(hash in this._cells)) {
        console.error("Collision grid hash out of bounds :(");
        continue;
      }
      this._cells[hash].add(e);
    }
  };

  // Shows the grid outline for debugging
  drawGrid = () => {
    const lines: Line[] = [];
    for (let x = 0; x < this._numCellsPerRow; x++) {
      lines.push(
        new Line({
          x1: x * this._cellSize,
          x2: x * this._cellSize,
          y1: 0,
          y2: this._height
        })
      );
    }
    for (let y = 0; y < this._numCellsPerRow; y++) {
      lines.push(
        new Line({
          x1: 0,
          x2: this._width,
          y1: y * this._cellSize,
          y2: y * this._cellSize
        })
      );
    }

    let renderLines = new PIXI.Graphics();
    for (let line of lines) {
      renderLines
        .lineStyle(1, 0xffffff)
        .moveTo(line.x1, line.y1)
        .lineTo(line.x2, line.y2);
    }
    this._game.app.stage.addChild(renderLines);
  };
}

export class Cell {
  private _bounds: Rect;
  private _entities: Entity[] = [];

  constructor(topLeft: Point, cellSize: number) {
    this._bounds = Rect.FromPoint(topLeft, cellSize);
  }

  public get entities(): Entity[] {
    return this._entities;
  }

  add = (e: Entity) => {
    this._entities.push(e);
  };

  removeAll = () => {
    this._entities = [];
  };
}
