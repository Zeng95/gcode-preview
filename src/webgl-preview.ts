import { Parser, MoveCommand } from './gcode-parser';
import * as THREE from 'three';
import * as OrbitControls  from 'three-orbitcontrols';

type RenderLayer = { extrusion: number[], travel: number[], z: number };
type Point = {x:number, y:number, z:number};
type State = {x:number, y:number, z:number, e:number}; // feedrate?

type WebGLPreviewOptions = Partial<{
  targetId: string,
}>

export class WebGLPreview implements WebGLPreviewOptions {
  parser = new Parser()
  limit: number
  targetId: string
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  group: THREE.Group
  backgroundColor = 0xe0e0e0
  travelColor = 0x990000
  extrusionColor = 0x00FF00
  upperLayerColor : number | null = null // = new THREE.Color(`hsl(180, 50%, 50%)`).getHex()
  currentSegmentColor : number | null = null // = new THREE.Color(`hsl(270, 50%, 50%)`).getHex()
  container: HTMLElement
  canvas : HTMLCanvasElement
  renderExtrusion = true
  renderTravel = false

  constructor(opts: WebGLPreviewOptions) {
    this.scene =  new THREE.Scene();
    this.scene.background = new THREE.Color( this.backgroundColor );
    this.targetId = opts.targetId;
    this.container = document.getElementById(this.targetId);
    if (!this.container) throw new Error('Unable to find element ' + this.targetId);
    
    this.camera = new THREE.PerspectiveCamera( 75, this.container.offsetWidth/this.container.offsetHeight, 0.1, 1000 );
    this.camera.position.set( 0, 0, 50 );
    this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true}); // enables snapshots
    this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.canvas = this.renderer.domElement;
    this.container.appendChild( this.canvas );
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.animate();
  }

  get layers() {
    return this.parser.layers;
  }

  animate() {
    requestAnimationFrame(() => this.animate() );
    this.renderer.render( this.scene, this.camera );
  }

  processGCode(gcode: string | string[]) {
    this.parser.parseGcode(gcode);

    this.limit = this.layers.length - 1;

    this.render();
  }

  render() {
    while(this.scene.children.length > 0){ 
      this.scene.remove(this.scene.children[0]); 
    }
    this.group = new THREE.Group();
    this.group.name = 'gcode';
    const state = {x:0, y:0, z:0, e:0};

    for (let index=0 ; index < this.layers.length ; index++ ) {
      if (index > this.limit) break;
    
      const currentLayer : RenderLayer = { extrusion: [], travel: [], z: state.z };
      const l = this.layers[index];
      for (const cmd of l.commands) {
        if (cmd.gcode == 'g0' || cmd.gcode == 'g1') {
          const g = (cmd as MoveCommand);
          
          const next : State = {
            x: g.params.x !== undefined ? g.params.x : state.x,
            y: g.params.y !== undefined ? g.params.y : state.y,
            z: g.params.z !== undefined ? g.params.z : state.z,
            e: g.params.e !== undefined ? g.params.e : state.e
          };
          const extrude = g.params.e > 0;
          if (extrude && this.renderExtrusion || !extrude && this.renderTravel)
            this.addLineSegment(currentLayer, state, next, extrude);
          
          // update state 
          if (g.params.x) state.x = g.params.x;
          if (g.params.y) state.y = g.params.y;
          if (g.params.z) state.z = g.params.z;
          if (g.params.e) state.e = g.params.e;
        }
      }
      
      if (this.renderExtrusion) {
        const brightness = Math.round(80 * index/this.layers.length);
        const extrusionColor = new THREE.Color(`hsl(0, 0%, ${brightness}%)`).getHex();
        
        if(index == this.limit) {
          const layerColor = this.upperLayerColor != null ? 
            this.upperLayerColor :
            extrusionColor;
          
          const lastSegmentColor = this.currentSegmentColor != null ? this.currentSegmentColor : layerColor;

          const endPoint = currentLayer.extrusion.splice(-3);
          this.addLine( currentLayer.extrusion, layerColor);
          const preendPoint = currentLayer.extrusion.splice(-3);
          this.addLine( [...preendPoint, ...endPoint], lastSegmentColor);
        }
        else {
          this.addLine( currentLayer.extrusion, extrusionColor);
        }
      }
      
      if (this.renderTravel) {
        this.addLine( currentLayer.travel, this.travelColor);
      }
    }

    this.group.quaternion.setFromEuler( new THREE.Euler( -Math.PI/2, 0, 0 ) );
    this.group.position.set( - 100, - 20, 100 );
    this.scene.add( this.group );
    this.renderer.render( this.scene, this.camera );
  }

  resize() {
    this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
  }

  addLineSegment(layer: RenderLayer, p1: Point, p2: Point, extrude: boolean) {
    const line = extrude ? layer.extrusion : layer.travel;
    line.push( p1.x, p1.y, p1.z );
    line.push( p2.x, p2.y, p2.z );
  }

  addLine(vertices: number[], color: number) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    
    const material = new THREE.LineBasicMaterial( { color: color } );
    const lineSegments = new THREE.LineSegments( geometry, material );
    this.group.add( lineSegments );
  }
}
