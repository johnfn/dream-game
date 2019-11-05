import React from 'react';
import { Game } from './game';

class ReactWrapper extends React.Component<{}, {}> {
  game: Game;

  constructor(props: {}) {
    super(props);

    this.game = new Game();
  }

  render() {
    return (
      <div className="App">
      </div>
    );
  }
}

export default ReactWrapper;
