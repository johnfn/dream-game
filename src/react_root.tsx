import React from 'react';
import { Game } from './game';
import { Entity } from './library/entity';
import { Container, autoDetectRenderer } from 'pixi.js';

type HP = { root: Entity | Container };

class Hierarchy extends React.Component<HP, { hover: boolean }> {
  constructor(props: HP) {
    super(props);

    this.state = {
      hover: false,
    };
  }

  oldTint: { [key: number]: number } = {};

  mouseOver = () => {
    this.setState({ hover: true })

    if (this.props.root instanceof Entity) {
      this.oldTint[this.props.root.id] = this.props.root.sprite.tint;

      this.props.root.sprite.tint = 0x000099;
    }
  };

  mouseOut = () => {
    this.setState({ hover: false })

    if (this.props.root instanceof Entity) {
      this.props.root.sprite.tint = this.oldTint[this.props.root.id];
    }
  };

  render() {
    const root = this.props.root;

    return (
      <div 
        onMouseEnter={this.mouseOver}
        onMouseLeave={this.mouseOut}
        style={{ paddingLeft: "10px", backgroundColor: this.state.hover ? "#eee" : "#fff" }}
      >
        { root.name } { root.zIndex }

        {
          root.children.length > 0 &&
            root.children.map(child => {
              if (child instanceof Entity) {
                return <Hierarchy root={ child } />
              } else {
                return null;
              }
            })
        }
      </div>
    )
  };

}

class ReactWrapper extends React.Component<{}, { }> {
  static Instance: ReactWrapper;
  game !: Game;

  componentDidMount() {
    ReactWrapper.Instance = this;

    this.game = new Game();

    setTimeout(this.monitor, 1000);
  }

  componentWillUnmount() {
    console.error("This should never happen!!!! very bad?!?");
  }

  constructor(props: {}) {
    super(props);

    this.forceUpdate();

    this.state = {
      stuff: [],
    };

    setInterval(() => this.monitor());
  }

  monitor = () => {
    this.forceUpdate();
  };

  render() {
    return (
      <div style={{
        display: "flex",
        flexDirection: "row",
        borderLeft: "1px solid lightgray",
      }}>
        <canvas id="canvas">

        </canvas>
        <div style={{
          overflow: "auto",
          height: "100vh",
        }}>
          { this.game && this.game.stage && <Hierarchy root={this.game.stage} /> }
        </div>
      </div>
    );
  }
}

export default ReactWrapper;
