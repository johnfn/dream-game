import { Entity } from "./entity";
import { GameMode } from "../state";
import { Texture } from "pixi.js";

export class Trapdoor extends Entity {
    constructor(props: {
        texture   : Texture;
        collidable: boolean;
        dynamic   : boolean;

      }) {
        super(props)

    }

    activeModes = [GameMode.Normal];

    update = () => {
        // Load new level
    }
    collide = (other: Entity) => {
        // Open door if collider is player
    }
}