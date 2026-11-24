export type FloorPoint={x:number;y:number;z:number};
type Sample={point:FloorPoint;time:number};
const distance=(a:FloorPoint,b:FloorPoint)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

// A stability gate, not a claim about the device's absolute measurement accuracy.
export class FloorPlacement {
 private samples:Sample[]=[];
 private candidate:FloorPoint|null=null;
 private fixed:FloorPoint|null=null;
 ready=false;
 hint:'no-surface'|'tilted'|'range'|'steady'|'ready'='no-surface';
 get previewPoint(){return this.candidate?{...this.candidate}:null}
 get position(){return this.fixed?{...this.fixed}:null}
 get isPlaced(){return this.fixed!==null}
 observe(matrix:ArrayLike<number>|null,time:number,viewer:FloorPoint,tracked=true){
  if(this.fixed)return false; // New camera hit tests must never drag a placed object.
  if(!tracked||!matrix||matrix.length!==16||!Array.from(matrix).every(Number.isFinite)){this.resetSamples();this.hint='no-surface';return false}
  if(matrix[5]<.95){this.resetSamples();this.hint='tilted';return false}
  const point={x:matrix[12],y:matrix[13],z:matrix[14]};
  const range=distance(point,viewer),below=viewer.y-point.y;
  if(range<.4||range>3||below<.35||below>2.3){this.resetSamples();this.hint='range';return false}
  const last=this.samples.at(-1);
  if(last&&(time-last.time>250||time<=last.time))this.resetSamples();
  this.samples=this.samples.filter(sample=>time-sample.time<=500);
  if(this.samples.some(sample=>distance(sample.point,point)>.06))this.resetSamples();
  this.samples.push({point,time});this.candidate=point;
  this.ready=this.samples.length>=8&&time-this.samples[0].time>=300;
  this.hint=this.ready?'ready':'steady';
  return this.ready;
 }
 place(){if(!this.ready||!this.candidate||this.fixed)return null;this.fixed={...this.candidate};this.ready=false;return this.position}
 updateAnchor(point:FloorPoint){if(this.fixed&&Object.values(point).every(Number.isFinite))this.fixed={...point};return this.position}
 resetSamples(){this.samples=[];this.candidate=null;this.ready=false;this.hint='no-surface'}
 reposition(){this.fixed=null;this.resetSamples()}
}
