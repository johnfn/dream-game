import { Entity } from "./library/entity";
import { Game } from "./game";
import { Texture } from "pixi.js";


export class DreamShard extends Entity {
    constructor(props: {
      game      : Game;
      texture   : Texture;
      collidable: boolean;
      dynamic   : boolean;
    }) {
        super(props);
    }

    collide = () => {}
    interact = () => {}
    update = () => {}
}