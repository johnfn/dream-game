import { Game } from './game';
import { Point } from './library/point';
import { Rect } from './library/rect';

export class Entity extends PIXI.Sprite {
    private _velocity: Point = Point.Zero;
    
    constructor(texture: PIXI.Texture, game: Game) {
        super(texture);
        game.entities.push(this);
    }

    public get bounds(): Rect {
        const b = this._bounds;
        return new Rect({
            x: b.minX,
            y: b.minY,
            w: b.maxX - b.minX,
            h: b.maxY- b.minY
        })
    }

    update = () => {
        this.position.x += this._velocity.x / 60;
        this.position.y += this._velocity.y / 60;
    }
}