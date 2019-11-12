import React from 'react';

import { Entity } from "./entity";
import { GameState } from "../state";
import { Sprite } from 'pixi.js';
import ReactWrapper from '../react_root';

export class ReactTextComponent extends React.Component<{
  x: number;
  y: number;
  content: JSX.Element;
}, {}> {
  static Texts: JSX.Element[] = [];

  render() {
    return (
      <div
        style={{
          "position": "absolute",
          "color": "white",
          userSelect: "none",
          MozUserSelect: "none",
          KhtmlUserSelect: "none",
          WebkitUserSelect: "none",
          // "-o-user-select": "none", // who uses opera anyways?
          "left": `${ this.props.x }px`,
          "top": `${ this.props.y }px`,
        }}
      >
        { this.props.content }
      </div>
    );
  }
}

export class TextEntity extends Sprite {
  jsx: JSX.Element;

  constructor(html: string) {
    super();

    this.jsx = (
      <ReactTextComponent 
        x = { this.x } 
        y = { this.y } 
        content = { <div dangerouslySetInnerHTML={{ __html: html }} /> }
      />
    );

    ReactTextComponent.Texts.push(this.jsx);
    ReactWrapper.Instance.forceUpdate();
  }

  collide = (other: Entity) => {

  };

  update = (state: GameState) => {

  };

  destroy() {
    ReactTextComponent.Texts.splice(ReactTextComponent.Texts.indexOf(this.jsx), 1);
  }
}