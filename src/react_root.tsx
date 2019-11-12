import React from 'react';
import { Game } from './game';

class ReactWrapper extends React.Component<{}, {}> {
  static Instance: ReactWrapper;

  game: Game;

  componentDidMount() {
    ReactWrapper.Instance = this;
  }

  componentWillUnmount() {
    console.error("This should never happen!!!! very bad?!?");
  }

  constructor(props: {}) {
    super(props);

    this.game = new Game();

    this.forceUpdate();
  }

  render() {
    return (
      <div className="App">
      </div>
    );
  }
}

export default ReactWrapper;
