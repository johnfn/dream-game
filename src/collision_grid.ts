import * as PIXI from "pixi.js";
import { Rect } from "./library/rect";
import { Line } from "./library/line";
import { Game } from "./game";
import { Vector2 } from "./library/vector2";

type CollisionResult = {
  firstRect : Rect;
  secondRect: Rect;
  overlap   : Rect;
};

export class CollisionGrid {
  private _position: Vector2 = Vector2.Zero;
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
        const pos = new Vector2({
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

  /** 
   * Checks if the rect would collide with anything on the grid. (Does not add
   * the rect to the grid.)
   */
  checkForCollision = (rect: Rect): CollisionResult | null => {
    const hashes = Array.from(new Set(this.hashCorners(rect)));
    const cells = hashes.map(hash => this._cells[hash]);

    for (const cell of cells) {
      if (!cell) { continue; } // TODO: i think this means the cell is at a negative coordinate

      for (const rectInCell of cell.rects) {
        const overlap = rect.getIntersection(rectInCell, false);

        if (overlap) {
          return {
            firstRect : rectInCell,
            secondRect: rect,
            overlap
          }
        }
      }
    }

    return null;
  };

  /**
   * Get all collisions on the grid.
   */
  getAllCollisions = (): CollisionResult[] => {
    const result: CollisionResult[] = [];

    for (let cell of this.cells) {
      const cellRects = cell.rects;

      for (let i = 0; i < cellRects.length; i++) {
        for (let j = i; j < cellRects.length; j++) {
          if (i === j) continue;

          const rect1 = cellRects[i];
          const rect2 = cellRects[j];

          const intersection = rect1.getIntersection(rect2, false);

          if (intersection !== undefined) {
            result.push({
              firstRect : rect1,
              secondRect: rect2,
              overlap   : intersection,
            })
          }
        }
      }
    }

    return result;
  }

  // Computes the hash of a position, which corresponds to a single cell in the grid.
  hashPosition = (pos: Vector2): number => {
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

  // Add a rect to the hash grid.
  // Checks each corner, to handle entities that span multiply grid cells.
  add = (rect: Rect) => {
    // Remove duplicate hashes
    const hashes = Array.from(new Set(this.hashCorners(rect)));

    for (let hash of hashes) {
      if (!(hash in this._cells)) {
        console.error("Collision grid hash out of bounds :(");

        continue;
      }

      this._cells[hash].add(rect);
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
  private _rects: Rect[] = [];

  constructor(topLeft: Vector2, cellSize: number) {
    this._bounds = Rect.FromPoint(topLeft, cellSize);
  }

  public get rects(): Rect[] {
    return this._rects;
  }

  add = (e: Rect) => {
    this._rects.push(e);
  };

  removeAll = () => {
    this._rects = [];
  };
}
