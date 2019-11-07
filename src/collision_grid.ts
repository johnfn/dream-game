import * as PIXI from "pixi.js";
import { Rect } from "./library/rect";
import { Entity } from "./entity";
import { Line } from "./library/line";
import { C } from "./constants";
import { Game } from "./game";
import { Point } from "./library/point";

export class CollisionGrid {
  private _game: Game;
  private _width: number;
  private _height: number;
  private _cellSize: number;
  private _numCellsPerRow: number;
  private _numCellsPerCol: number;
  private _cells: { [index: number]: Cell } = {};

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

  // Add an entity to the hash grid.
  // Checks each corner, to handle entities that span multiply grid cells.
  add = (e: Entity) => {
    // Remove duplicate hashes
    const hashes = Array.from(new Set(this.hashCorners(e.bounds)));
    for (let hash of hashes) {
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
          y2: C.CANVAS_HEIGHT
        })
      );
    }
    for (let y = 0; y < this._numCellsPerRow; y++) {
      lines.push(
        new Line({
          x1: 0,
          x2: C.CANVAS_WIDTH,
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
