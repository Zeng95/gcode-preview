!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports,require("three"),require("three-orbitcontrols")):"function"==typeof define&&define.amd?define(["exports","three","three-orbitcontrols"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).GCodePreview={},t.THREE,t.THREE.OrbitControls)}(this,(function(t,e,n){"use strict";var i="default"in e?e.default:e;class r{constructor(){this.chars=""}static parse(t){const e=new r,n=t.split(" ");e.size=n[0];const i=e.size.split("x");return e.width=+i[0],e.height=+i[1],e.charLength=+n[1],e}get src(){return"data:image/jpeg;base64,"+this.chars}get isValid(){return this.chars.length==this.charLength&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(this.chars)}}class s{constructor(t,e,n,i){this.src=t,this.gcode=e,this.params=n,this.comment=i}}class a extends s{constructor(t,e,n,i){super(t,e,n,i),this.params=n}}class o{constructor(t,e,n){this.layer=t,this.commands=e,this.lineNumber=n}}class c{constructor(){this.lines=[],this.preamble=new o(-1,[],0),this.layers=[],this.curZ=0,this.maxZ=0,this.metadata={thumbnails:{}}}parseGCode(t){const e=Array.isArray(t)?t:t.split("\n");this.lines=this.lines.concat(e);const n=this.lines2commands(e);this.groupIntoLayers(n.filter((t=>t instanceof a)));const i=this.parseMetadata(n.filter((t=>t.comment))).thumbnails;for(const[t,e]of Object.entries(i))this.metadata.thumbnails[t]=e;return{layers:this.layers,metadata:this.metadata}}lines2commands(t){return t.map((t=>this.parseCommand(t)))}parseCommand(t,e=!0){const n=t.trim().split(";"),i=n[0],r=e&&n[1]||null,o=i.split(/ +/g),c=o[0].toLowerCase();let l;switch(c){case"g0":case"g1":return l=this.parseMove(o.slice(1)),new a(t,c,l,r);default:return l=this.parseParams(o.slice(1)),new s(t,c,l,r)}}parseMove(t){return t.reduce(((t,e)=>{const n=e.charAt(0).toLowerCase();return"x"!=n&&"y"!=n&&"z"!=n&&"e"!=n&&"f"!=n||(t[n]=parseFloat(e.slice(1))),t}),{})}isAlpha(t){const e=t.charCodeAt(0);return e>=97&&e<=122||e>=65&&e<=90}parseParams(t){return t.reduce(((t,e)=>{const n=e.charAt(0).toLowerCase();return this.isAlpha(n)&&(t[n]=parseFloat(e.slice(1))),t}),{})}groupIntoLayers(t){for(let e=0;e<t.length;e++){const n=t[e];if(!(n instanceof a)){this.currentLayer?this.currentLayer.commands.push(n):this.preamble.commands.push(n);continue}const i=n.params;i.z&&(this.curZ=i.z),i.e>0&&(null!=i.x||null!=i.y)&&this.curZ>this.maxZ?(this.maxZ=this.curZ,this.currentLayer=new o(this.layers.length,[n],e),this.layers.push(this.currentLayer)):this.currentLayer?this.currentLayer.commands.push(n):this.preamble.commands.push(n)}return this.layers}parseMetadata(t){const e={};let n=null;for(const i of t){const t=i.comment,s=t.indexOf("thumbnail begin"),a=t.indexOf("thumbnail end");s>-1?n=r.parse(t.slice(s+15).trim()):n&&(-1==a?n.chars+=t.trim():(n.isValid?(e[n.size]=n,console.debug("thumb found",n.size),console.debug("declared length",n.charLength,"actual length",n.chars.length)):console.warn("thumb found but seems to be invalid"),n=null))}return{thumbnails:e}}}c.prototype.parseGcode=c.prototype.parseGCode,e.UniformsLib.line={linewidth:{value:1},resolution:{value:new e.Vector2(1,1)},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},e.ShaderLib.line={uniforms:e.UniformsUtils.merge([e.UniformsLib.common,e.UniformsLib.fog,e.UniformsLib.line]),vertexShader:"\n\t\t#include <common>\n\t\t#include <color_pars_vertex>\n\t\t#include <fog_pars_vertex>\n\t\t#include <logdepthbuf_pars_vertex>\n\t\t#include <clipping_planes_pars_vertex>\n\n\t\tuniform float linewidth;\n\t\tuniform vec2 resolution;\n\n\t\tattribute vec3 instanceStart;\n\t\tattribute vec3 instanceEnd;\n\n\t\tattribute vec3 instanceColorStart;\n\t\tattribute vec3 instanceColorEnd;\n\n\t\tvarying vec2 vUv;\n\n\t\t#ifdef USE_DASH\n\n\t\t\tuniform float dashScale;\n\t\t\tattribute float instanceDistanceStart;\n\t\t\tattribute float instanceDistanceEnd;\n\t\t\tvarying float vLineDistance;\n\n\t\t#endif\n\n\t\tvoid trimSegment( const in vec4 start, inout vec4 end ) {\n\n\t\t\t// trim end segment so it terminates between the camera plane and the near plane\n\n\t\t\t// conservative estimate of the near plane\n\t\t\tfloat a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column\n\t\t\tfloat b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column\n\t\t\tfloat nearEstimate = - 0.5 * b / a;\n\n\t\t\tfloat alpha = ( nearEstimate - start.z ) / ( end.z - start.z );\n\n\t\t\tend.xyz = mix( start.xyz, end.xyz, alpha );\n\n\t\t}\n\n\t\tvoid main() {\n\n\t\t\t#ifdef USE_COLOR\n\n\t\t\t\tvColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;\n\n\t\t\t#endif\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tvLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;\n\n\t\t\t#endif\n\n\t\t\tfloat aspect = resolution.x / resolution.y;\n\n\t\t\tvUv = uv;\n\n\t\t\t// camera space\n\t\t\tvec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );\n\t\t\tvec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );\n\n\t\t\t// special case for perspective projection, and segments that terminate either in, or behind, the camera plane\n\t\t\t// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space\n\t\t\t// but we need to perform ndc-space calculations in the shader, so we must address this issue directly\n\t\t\t// perhaps there is a more elegant solution -- WestLangley\n\n\t\t\tbool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column\n\n\t\t\tif ( perspective ) {\n\n\t\t\t\tif ( start.z < 0.0 && end.z >= 0.0 ) {\n\n\t\t\t\t\ttrimSegment( start, end );\n\n\t\t\t\t} else if ( end.z < 0.0 && start.z >= 0.0 ) {\n\n\t\t\t\t\ttrimSegment( end, start );\n\n\t\t\t\t}\n\n\t\t\t}\n\n\t\t\t// clip space\n\t\t\tvec4 clipStart = projectionMatrix * start;\n\t\t\tvec4 clipEnd = projectionMatrix * end;\n\n\t\t\t// ndc space\n\t\t\tvec2 ndcStart = clipStart.xy / clipStart.w;\n\t\t\tvec2 ndcEnd = clipEnd.xy / clipEnd.w;\n\n\t\t\t// direction\n\t\t\tvec2 dir = ndcEnd - ndcStart;\n\n\t\t\t// account for clip-space aspect ratio\n\t\t\tdir.x *= aspect;\n\t\t\tdir = normalize( dir );\n\n\t\t\t// perpendicular to dir\n\t\t\tvec2 offset = vec2( dir.y, - dir.x );\n\n\t\t\t// undo aspect ratio adjustment\n\t\t\tdir.x /= aspect;\n\t\t\toffset.x /= aspect;\n\n\t\t\t// sign flip\n\t\t\tif ( position.x < 0.0 ) offset *= - 1.0;\n\n\t\t\t// endcaps\n\t\t\tif ( position.y < 0.0 ) {\n\n\t\t\t\toffset += - dir;\n\n\t\t\t} else if ( position.y > 1.0 ) {\n\n\t\t\t\toffset += dir;\n\n\t\t\t}\n\n\t\t\t// adjust for linewidth\n\t\t\toffset *= linewidth;\n\n\t\t\t// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...\n\t\t\toffset /= resolution.y;\n\n\t\t\t// select end\n\t\t\tvec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;\n\n\t\t\t// back to clip space\n\t\t\toffset *= clip.w;\n\n\t\t\tclip.xy += offset;\n\n\t\t\tgl_Position = clip;\n\n\t\t\tvec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation\n\n\t\t\t#include <logdepthbuf_vertex>\n\t\t\t#include <clipping_planes_vertex>\n\t\t\t#include <fog_vertex>\n\n\t\t}\n\t\t",fragmentShader:"\n\t\tuniform vec3 diffuse;\n\t\tuniform float opacity;\n\n\t\t#ifdef USE_DASH\n\n\t\t\tuniform float dashSize;\n\t\t\tuniform float gapSize;\n\n\t\t#endif\n\n\t\tvarying float vLineDistance;\n\n\t\t#include <common>\n\t\t#include <color_pars_fragment>\n\t\t#include <fog_pars_fragment>\n\t\t#include <logdepthbuf_pars_fragment>\n\t\t#include <clipping_planes_pars_fragment>\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\t#include <clipping_planes_fragment>\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tif ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps\n\n\t\t\t\tif ( mod( vLineDistance, dashSize + gapSize ) > dashSize ) discard; // todo - FIX\n\n\t\t\t#endif\n\n\t\t\tif ( abs( vUv.y ) > 1.0 ) {\n\n\t\t\t\tfloat a = vUv.x;\n\t\t\t\tfloat b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;\n\t\t\t\tfloat len2 = a * a + b * b;\n\n\t\t\t\tif ( len2 > 1.0 ) discard;\n\n\t\t\t}\n\n\t\t\tvec4 diffuseColor = vec4( diffuse, opacity );\n\n\t\t\t#include <logdepthbuf_fragment>\n\t\t\t#include <color_fragment>\n\n\t\t\tgl_FragColor = vec4( diffuseColor.rgb, diffuseColor.a );\n\n\t\t\t#include <tonemapping_fragment>\n\t\t\t#include <encodings_fragment>\n\t\t\t#include <fog_fragment>\n\t\t\t#include <premultiplied_alpha_fragment>\n\n\t\t}\n\t\t"};var l=function(t){e.ShaderMaterial.call(this,{type:"LineMaterial",uniforms:e.UniformsUtils.clone(e.ShaderLib.line.uniforms),vertexShader:e.ShaderLib.line.vertexShader,fragmentShader:e.ShaderLib.line.fragmentShader,clipping:!0}),this.dashed=!1,Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(t){this.uniforms.diffuse.value=t}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(t){this.uniforms.linewidth.value=t}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(t){this.uniforms.dashScale.value=t}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(t){this.uniforms.dashSize.value=t}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(t){this.uniforms.gapSize.value=t}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(t){this.uniforms.resolution.value.copy(t)}}}),this.setValues(t)};(l.prototype=Object.create(e.ShaderMaterial.prototype)).constructor=l,l.prototype.isLineMaterial=!0;var u,d=function(){e.InstancedBufferGeometry.call(this),this.type="LineSegmentsGeometry";this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new e.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new e.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))};d.prototype=Object.assign(Object.create(e.InstancedBufferGeometry.prototype),{constructor:d,isLineSegmentsGeometry:!0,applyMatrix4:function(t){var e=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==e&&(e.applyMatrix4(t),n.applyMatrix4(t),e.data.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this},setPositions:function(t){var n;t instanceof Float32Array?n=t:Array.isArray(t)&&(n=new Float32Array(t));var i=new e.InstancedInterleavedBuffer(n,6,1);return this.setAttribute("instanceStart",new e.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new e.InterleavedBufferAttribute(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this},setColors:function(t){var n;t instanceof Float32Array?n=t:Array.isArray(t)&&(n=new Float32Array(t));var i=new e.InstancedInterleavedBuffer(n,6,1);return this.setAttribute("instanceColorStart",new e.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceColorEnd",new e.InterleavedBufferAttribute(i,3,3)),this},fromWireframeGeometry:function(t){return this.setPositions(t.attributes.position.array),this},fromEdgesGeometry:function(t){return this.setPositions(t.attributes.position.array),this},fromMesh:function(t){return this.fromWireframeGeometry(new e.WireframeGeometry(t.geometry)),this},fromLineSegements:function(t){var e=t.geometry;return e.isGeometry?this.setPositions(e.vertices):e.isBufferGeometry&&this.setPositions(e.position.array),this},computeBoundingBox:function(){var t=new e.Box3;return function(){null===this.boundingBox&&(this.boundingBox=new e.Box3);var n=this.attributes.instanceStart,i=this.attributes.instanceEnd;void 0!==n&&void 0!==i&&(this.boundingBox.setFromBufferAttribute(n),t.setFromBufferAttribute(i),this.boundingBox.union(t))}}(),computeBoundingSphere:(u=new e.Vector3,function(){null===this.boundingSphere&&(this.boundingSphere=new e.Sphere),null===this.boundingBox&&this.computeBoundingBox();var t=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(void 0!==t&&void 0!==n){var i=this.boundingSphere.center;this.boundingBox.getCenter(i);for(var r=0,s=0,a=t.count;s<a;s++)u.fromBufferAttribute(t,s),r=Math.max(r,i.distanceToSquared(u)),u.fromBufferAttribute(n,s),r=Math.max(r,i.distanceToSquared(u));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}),toJSON:function(){},applyMatrix:function(t){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(t)}});var h=function(){d.call(this),this.type="LineGeometry"};h.prototype=Object.assign(Object.create(d.prototype),{constructor:h,isLineGeometry:!0,setPositions:function(t){for(var e=t.length-3,n=new Float32Array(2*e),i=0;i<e;i+=3)n[2*i]=t[i],n[2*i+1]=t[i+1],n[2*i+2]=t[i+2],n[2*i+3]=t[i+3],n[2*i+4]=t[i+4],n[2*i+5]=t[i+5];return d.prototype.setPositions.call(this,n),this},setColors:function(t){for(var e=t.length-3,n=new Float32Array(2*e),i=0;i<e;i+=3)n[2*i]=t[i],n[2*i+1]=t[i+1],n[2*i+2]=t[i+2],n[2*i+3]=t[i+3],n[2*i+4]=t[i+4],n[2*i+5]=t[i+5];return d.prototype.setColors.call(this,n),this},fromLine:function(t){var e=t.geometry;return e.isGeometry?this.setPositions(e.vertices):e.isBufferGeometry&&this.setPositions(e.position.array),this},copy:function(){return this}});var p,f,m=function(t,n){e.Mesh.call(this),this.type="LineSegments2",this.geometry=void 0!==t?t:new d,this.material=void 0!==n?n:new l({color:16777215*Math.random()})};m.prototype=Object.assign(Object.create(e.Mesh.prototype),{constructor:m,isLineSegments2:!0,computeLineDistances:(p=new e.Vector3,f=new e.Vector3,function(){for(var t=this.geometry,n=t.attributes.instanceStart,i=t.attributes.instanceEnd,r=new Float32Array(2*n.data.count),s=0,a=0,o=n.data.count;s<o;s++,a+=2)p.fromBufferAttribute(n,s),f.fromBufferAttribute(i,s),r[a]=0===a?0:r[a-1],r[a+1]=r[a]+p.distanceTo(f);var c=new e.InstancedInterleavedBuffer(r,2,1);return t.setAttribute("instanceDistanceStart",new e.InterleavedBufferAttribute(c,1,0)),t.setAttribute("instanceDistanceEnd",new e.InterleavedBufferAttribute(c,1,1)),this}),raycast:function(){var t=new e.Vector4,n=new e.Vector4,i=new e.Vector4,r=new e.Vector3,s=new e.Matrix4,a=new e.Line3,o=new e.Vector3;return function(c,l){null===c.camera&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2.');var u=c.ray,d=c.camera,h=d.projectionMatrix,p=this.geometry,f=this.material,m=f.resolution,y=f.linewidth,v=p.attributes.instanceStart,g=p.attributes.instanceEnd;u.at(1,i),i.w=1,i.applyMatrix4(d.matrixWorldInverse),i.applyMatrix4(h),i.multiplyScalar(1/i.w),i.x*=m.x/2,i.y*=m.y/2,i.z=0,r.copy(i);var b=this.matrixWorld;s.multiplyMatrices(d.matrixWorldInverse,b);for(var x=0,w=v.count;x<w;x++){t.fromBufferAttribute(v,x),n.fromBufferAttribute(g,x),t.w=1,n.w=1,t.applyMatrix4(s),n.applyMatrix4(s),t.applyMatrix4(h),n.applyMatrix4(h),t.multiplyScalar(1/t.w),n.multiplyScalar(1/n.w);var S=t.z<-1&&n.z<-1,L=t.z>1&&n.z>1;if(!S&&!L){t.x*=m.x/2,t.y*=m.y/2,n.x*=m.x/2,n.y*=m.y/2,a.start.copy(t),a.start.z=0,a.end.copy(n),a.end.z=0;var A=a.closestPointToPointParameter(r,!0);a.at(A,o);var z=e.MathUtils.lerp(t.z,n.z,A),B=z>=-1&&z<=1,M=r.distanceTo(o)<.5*y;if(B&&M){a.start.fromBufferAttribute(v,x),a.end.fromBufferAttribute(g,x),a.start.applyMatrix4(b),a.end.applyMatrix4(b);var C=new e.Vector3,E=new e.Vector3;u.distanceSqToSegment(a.start,a.end,E,C),l.push({point:E,pointOnLine:C,distance:u.origin.distanceTo(E),object:this,face:null,faceIndex:x,uv:null,uv2:null})}}}}}()});class y extends e.LineSegments{constructor(t,n,i,r,s=4473924,a=8947848){s=new e.Color(s),a=new e.Color(a);const o=Math.round(t/n);i=Math.round(i/r)*r/2;const c=[],l=[];let u=0;for(let e=-1*(t=o*n/2);e<=t;e+=n){c.push(e,0,-1*i,e,0,i);const t=0===e?s:a;t.toArray(l,u),u+=3,t.toArray(l,u),u+=3,t.toArray(l,u),u+=3,t.toArray(l,u),u+=3}for(let e=-1*i;e<=i;e+=r){c.push(-1*t,0,e,t,0,e);const n=0===e?s:a;n.toArray(l,u),u+=3,n.toArray(l,u),u+=3,n.toArray(l,u),u+=3,n.toArray(l,u),u+=3}const d=new e.BufferGeometry;d.setAttribute("position",new e.Float32BufferAttribute(c,3)),d.setAttribute("color",new e.Float32BufferAttribute(l,3));super(d,new e.LineBasicMaterial({vertexColors:!0,toneMapped:!1}))}}function v(t,e,n,r){const s=function(t,e,n){t*=.5,e*=.5,n*=.5;const r=new i.BufferGeometry,s=[];return s.push(-t,-e,-n,-t,e,-n,-t,e,-n,t,e,-n,t,e,-n,t,-e,-n,t,-e,-n,-t,-e,-n,-t,-e,n,-t,e,n,-t,e,n,t,e,n,t,e,n,t,-e,n,t,-e,n,-t,-e,n,-t,-e,-n,-t,-e,n,-t,e,-n,-t,e,n,t,e,-n,t,e,n,t,-e,-n,t,-e,n),r.setAttribute("position",new i.Float32BufferAttribute(s,3)),r}(t,e,n),a=new i.LineSegments(s,new i.LineDashedMaterial({color:new i.Color(r),dashSize:3,gapSize:1}));return a.computeLineDistances(),a}class g{constructor(t){var i,r;if(this.parser=new c,this.backgroundColor=14737632,this.travelColor=10027008,this.extrusionColor=65280,this.renderExtrusion=!0,this.renderTravel=!1,this.singleLayerMode=!1,this.initialCameraPosition=[-100,400,450],this.debug=!1,this.disposables=[],this.scene=new e.Scene,this.scene.background=new e.Color(this.backgroundColor),this.canvas=t.canvas,this.targetId=t.targetId,this.endLayer=t.endLayer,this.startLayer=t.startLayer,this.topLayerColor=t.topLayerColor,this.lastSegmentColor=t.lastSegmentColor,this.lineWidth=t.lineWidth,this.buildVolume=t.buildVolume,this.initialCameraPosition=null!==(i=t.initialCameraPosition)&&void 0!==i?i:this.initialCameraPosition,this.debug=null!==(r=t.debug)&&void 0!==r?r:this.debug,console.info("Using THREE r"+e.REVISION),console.debug("opts",t),!this.canvas&&!this.targetId)throw Error("Set either opts.canvas or opts.targetId");if(this.canvas)this.renderer=new e.WebGLRenderer({canvas:this.canvas,preserveDrawingBuffer:!0});else{const t=document.getElementById(this.targetId);if(!t)throw new Error("Unable to find element "+this.targetId);this.renderer=new e.WebGLRenderer({preserveDrawingBuffer:!0}),this.canvas=this.renderer.domElement,t.appendChild(this.canvas)}this.camera=new e.PerspectiveCamera(25,this.canvas.offsetWidth/this.canvas.offsetHeight,10,5e3),this.camera.position.fromArray(this.initialCameraPosition);const s=this.camera.far,a=.8*s;this.scene.fog=new e.Fog(this.scene.background,a,s),this.resize();new n(this.camera,this.renderer.domElement);this.animate()}get layers(){return this.parser.layers}get maxLayerIndex(){var t;return(null!==(t=this.endLayer)&&void 0!==t?t:this.layers.length)-1}get minLayerIndex(){var t;return this.singleLayerMode?this.maxLayerIndex:(null!==(t=this.startLayer)&&void 0!==t?t:0)-1}animate(){requestAnimationFrame((()=>this.animate())),this.renderer.render(this.scene,this.camera)}processGCode(t){this.parser.parseGCode(t),this.render()}render(){for(var t,n;this.scene.children.length>0;)this.scene.remove(this.scene.children[0]);for(;this.disposables.length>0;)this.disposables.pop().dispose();if(this.debug){const t=new e.AxesHelper(Math.max(this.buildVolume.x/2,this.buildVolume.y/2)+20);this.scene.add(t)}this.buildVolume&&this.drawBuildVolume(),this.group=new e.Group,this.group.name="gcode";const i={x:0,y:0,z:0,e:0};for(let r=0;r<this.layers.length&&!(r>this.maxLayerIndex);r++){const s={extrusion:[],travel:[],z:i.z},a=this.layers[r];for(const t of a.commands)if("g0"==t.gcode||"g1"==t.gcode){const e=t,n={x:void 0!==e.params.x?e.params.x:i.x,y:void 0!==e.params.y?e.params.y:i.y,z:void 0!==e.params.z?e.params.z:i.z,e:void 0!==e.params.e?e.params.e:i.e};if(r>=this.minLayerIndex){const t=e.params.e>0;(t&&this.renderExtrusion||!t&&this.renderTravel)&&this.addLineSegment(s,i,n,t)}e.params.x&&(i.x=e.params.x),e.params.y&&(i.y=e.params.y),e.params.z&&(i.z=e.params.z),e.params.e&&(i.e=e.params.e)}if(this.renderExtrusion){const i=Math.round(80*r/this.layers.length),a=new e.Color(`hsl(0, 0%, ${i}%)`).getHex();if(r==this.layers.length-1){const e=null!==(t=this.topLayerColor)&&void 0!==t?t:a,i=null!==(n=this.lastSegmentColor)&&void 0!==n?n:e,r=s.extrusion.splice(-3);this.addLine(s.extrusion,e);const o=s.extrusion.splice(-3);this.addLine([...o,...r],i)}else this.addLine(s.extrusion,a)}this.renderTravel&&this.addLine(s.travel,this.travelColor)}this.group.quaternion.setFromEuler(new e.Euler(-Math.PI/2,0,0)),this.buildVolume?this.group.position.set(-this.buildVolume.x/2,0,this.buildVolume.y/2):this.group.position.set(-100,0,100),this.scene.add(this.group),this.renderer.render(this.scene,this.camera)}drawBuildVolume(){this.scene.add(new y(this.buildVolume.x,10,this.buildVolume.y,10));const t=v(this.buildVolume.x,this.buildVolume.z,this.buildVolume.y,8947848);t.position.setY(this.buildVolume.z/2),this.scene.add(t)}clear(){this.startLayer=1,this.endLayer=1/0,this.singleLayerMode=!1,this.parser=new c}resize(){const[t,e]=[this.canvas.offsetWidth,this.canvas.offsetHeight];this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.renderer.setPixelRatio(window.devicePixelRatio),this.renderer.setSize(t,e,!1)}addLineSegment(t,e,n,i){(i?t.extrusion:t.travel).push(e.x,e.y,e.z,n.x,n.y,n.z)}addLine(t,n){if("number"==typeof this.lineWidth&&this.lineWidth>0)return void this.addThickLine(t,n);const i=new e.BufferGeometry;i.setAttribute("position",new e.Float32BufferAttribute(t,3)),this.disposables.push(i);const r=new e.LineBasicMaterial({color:n});this.disposables.push(r);const s=new e.LineSegments(i,r);this.group.add(s)}addThickLine(t,e){if(!t.length)return;const n=new h;this.disposables.push(n);const i=new l({color:e,linewidth:this.lineWidth/(1e3*window.devicePixelRatio)});this.disposables.push(i),n.setPositions(t);const r=new m(n,i);this.group.add(r)}}const b=g;t.WebGLPreview=g,t.init=b,Object.defineProperty(t,"__esModule",{value:!0})}));
