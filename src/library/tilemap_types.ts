export interface TiledTileLayerJSON {
  data: number[];

  height  : number;
  name    : string;
  opacity : number;
  startx  : number;
  starty  : number;
  visible : boolean;
  width   : number;
  x       : number;
  y       : number;

  type: "tilelayer";
}

export interface TiledObjectJSON {
  gid?: number;

  properties?: any;
  propertytypes?: { [key: string]: "int" | "string" };
  height: number;
  id: number;
  name: string;
  rotation: number;
  type: any;
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

export interface TiledObjectLayerJSON {
  draworder: "topdown";
  height: number;
  name: string;
  objects: TiledObjectJSON[];
  opacity: number;
  visible: boolean;
  width: number;
  x: number;
  y: number;

  type: "objectgroup";
}

export interface TilesetJSON {
  columns: number;
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  name: string;
  spacing: number;
  tilecount: number;
  tileheight: number;
  tilewidth: number;
}

export interface TiledJSON {
  height: number;
  width : number;
  nextobjectid: number;
  orientation: "orthogonal";
  renderorder: "right-down";
  tileheight: number;
  tilewidth: number;
  version: number;

  layers: (TiledTileLayerJSON | TiledObjectLayerJSON)[];
  tilesets: TilesetJSON[];
}

export interface Tile {
  x: number;
  y: number;

  tile: SpritesheetTile;
  layername: string;
}

export interface Tileset {
  gidStart: number;
  gidEnd: number;

  name: string;
  image: string;

  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
}

export interface TiledObject {
  tile: SpritesheetTile;

  properties?: { [key: string]: string; };

  height: number;
  width: number;

  x: number;
  y: number;
}

export interface SpritesheetTile {
  name: string;
  spritesheetx: number;
  spritesheety: number;
  tilewidth: number;
  tileheight: number
}
