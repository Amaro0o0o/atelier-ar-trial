import {sectionalTint} from './sectionalFinish.ts';
import {oakTint} from './oakFinish.ts';
import {roomPhoto} from './roomPhoto.ts';
import {Box3,DirectionalLight,Group,HemisphereLight,Mesh,MeshBasicMaterial,MeshStandardMaterial,PerspectiveCamera,PlaneGeometry,RingGeometry,Scene,ShadowMaterial,Texture,WebGLRenderer} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FloorPlacement} from './floorPlacement.ts';
export interface GroundState {phase:'idle'|'starting'|'scanning'|'placed';stable:boolean;tracking:boolean;loading:boolean;modelError?:string;modelVisible?:boolean;anchor:'none'|'creating'|'tracked'|'world';message:string}
export const initialGroundState:GroundState={phase:'idle',stable:false,tracking:false,loading:true,modelError:'',modelVisible:false,anchor:'none',message:''};
const finishColours:Record<string,string>={Natural:'#bc9164',Walnut:'#705039',Charcoal:'#424744'};
function disposeTree(root:Group){const textures=new Set<Texture>();root.traverse(object=>{if(object instanceof Mesh){object.geometry.dispose();for(const material of Array.isArray(object.material)?object.material:[object.material]){for(const value of Object.values(material))if(value instanceof Texture)textures.add(value);material.dispose()}}});textures.forEach(texture=>texture.dispose())}

export class GroundedAR {
 private shutter:((photo:string,error:string)=>void)|null=null;
 takePhoto(callback:(photo:string,error:string)=>void){this.shutter=callback}
 private state={...initialGroundState};
 private placement=new FloorPlacement();
 private renderer:WebGLRenderer|null=null;
 private scene=new Scene();
 private camera=new PerspectiveCamera();
 private floorRoot=new Group();
 private model:Group|null=null;
 private reticle=new Mesh(new RingGeometry(.11,.14,48).rotateX(-Math.PI/2),new MeshBasicMaterial({color:'#bce49b',depthTest:false}));
 private session:XRSession|null=null;
 private space:XRReferenceSpace|null=null;
 private hitSource:XRHitTestSource|null=null;
 private anchor:XRAnchor|null=null;
 private anchorSeen=false;
 private anchorPending=false;
 private loadSequence=0;
 private anchorSequence=0;
 private requestedPlace=false;
 private closed=false;
 private trackedFrames=0;
 private yaw=0;
 private finish='Natural';
 private modelUrl='';
 private onState:(state:GroundState)=>void;
 constructor(onState:(state:GroundState)=>void){this.onState=onState;this.floorRoot.visible=false;this.reticle.visible=false;this.scene.add(this.floorRoot,this.reticle,new HemisphereLight('#fff8ee','#615a49',2));const light=new DirectionalLight('#ffffff',3);light.position.set(1,3,2);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-1.5;light.shadow.camera.right=1.5;light.shadow.camera.top=1.5;light.shadow.camera.bottom=-1.5;light.shadow.normalBias=.005;this.scene.add(light);const shadow=new Mesh(new PlaneGeometry(3,3),new ShadowMaterial({opacity:.22}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.001;shadow.receiveShadow=true;this.floorRoot.add(shadow)}
 private update(patch:Partial<GroundState>){const next={...this.state,...patch};if(JSON.stringify(next)!==JSON.stringify(this.state)){this.state=next;this.onState({...next})}}
 async start(overlay:HTMLElement,url:string,finish:string){
  this.update({phase:'starting',message:'Starting the camera and floor tracking…'});
  try{
   // Request in the original button gesture, before awaiting model loading.
   const session=await navigator.xr!.requestSession('immersive-ar',{requiredFeatures:['hit-test','dom-overlay'],optionalFeatures:['local-floor','anchors','camera-access'],domOverlay:{root:overlay}});
   if(this.closed){await session.end();return}
   this.session=session;session.addEventListener('end',this.ended);
   if(!session.domOverlayState)throw new Error('This browser cannot show the AR placement controls. Open directly in Android Chrome.');
   let space:XRReferenceSpace,type:XRReferenceSpaceType='local-floor';
   try{space=await session.requestReferenceSpace(type)}catch{type='local';space=await session.requestReferenceSpace(type)}
   if(this.closed)return;
   this.space=space;space.addEventListener('reset',this.referenceReset);
   const viewerSpace=await session.requestReferenceSpace('viewer');
   this.hitSource=await session.requestHitTestSource?.({space:viewerSpace})||null;
   if(!this.hitSource)throw new Error('This device did not provide floor hit testing. Room placement cannot start.');
   if(this.closed)return;
   const renderer=new WebGLRenderer({alpha:true,antialias:true});this.renderer=renderer;renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(window.innerWidth,window.innerHeight);renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType(type);renderer.domElement.className='ground-ar-canvas';document.body.append(renderer.domElement);
   await renderer.xr.setSession(session);renderer.xr.setReferenceSpace(space);
   if(this.closed)return;
   this.update({phase:'scanning',message:'Aim at an empty floor spot. Hold still until the green ring is steady.'});
   void this.setModel(url,finish);renderer.setAnimationLoop(this.frame);
  }catch(error){await this.stop();throw error}
 }
 async setModel(url:string,finish:string){
  this.finish=finish;if(this.model&&url===this.modelUrl&&!this.state.loading&&!this.state.modelError){this.applyFinish();return}
  this.modelUrl=url;const sequence=++this.loadSequence;this.update({loading:true,modelError:''});
  try{const gltf=await new GLTFLoader().loadAsync(url);const next=gltf.scene;
   if(this.closed||sequence!==this.loadSequence){disposeTree(next);return}
   // Keep the anchor/floor node unchanged; replace only its geometry child.
   next.position.y-=new Box3().setFromObject(next).min.y;
   next.traverse(object=>{if(object instanceof Mesh){object.castShadow=true;object.receiveShadow=true}});
   if(this.model){this.floorRoot.remove(this.model);disposeTree(this.model)}
   this.model=next;this.floorRoot.add(next);this.applyFinish();this.update({loading:false,modelError:''});
  }catch{if(!this.closed&&sequence===this.loadSequence){this.floorRoot.visible=false;this.update({loading:false,modelVisible:false,modelError:'The furniture model could not load. Tap Retry model, or exit AR and try again.'})}}
 }
 private applyFinish(){this.model?.traverse(object=>{if(object instanceof Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof MeshStandardMaterial&&material.name==='Finish_Wood')material.color.set(material.map ? oakTint(this.finish) : finishColours[this.finish]||finishColours.Natural);else if(material instanceof MeshStandardMaterial&&material.name==='Sectional_Fabric')material.color.set(sectionalTint(this.finish))})}
 place(){
  if(!this.state.stable||this.state.loading||this.state.modelError||!this.state.tracking||!this.model)return;
  // Commit the exact point shown when the button is tapped. A later camera
  // frame (often disturbed by that tap) must not cancel this decision.
  const point=this.placement.place();if(!point)return;
  this.floorRoot.position.set(point.x,point.y,point.z);this.floorRoot.rotation.y=this.yaw;
  this.floorRoot.visible=true;this.reticle.visible=false;this.requestedPlace=true;
  this.update({phase:'placed',stable:false,modelVisible:true,anchor:'world',message:'Position fixed. Use Reposition to choose a different floor spot.'});
 }
 reposition(){this.releaseAnchor();this.placement.reposition();this.floorRoot.visible=false;this.requestedPlace=false;this.update({phase:'scanning',stable:false,modelVisible:false,anchor:'none',message:'Choose a floor spot again. Hold steady, then tap Place here.'})}
 private releaseAnchor(){this.anchorSequence++;try{this.anchor?.delete()}catch{}this.anchor=null;this.anchorSeen=false;this.anchorPending=false}
 showAtPlacedPosition(){
  if(!this.placement.isPlaced)return;
  this.releaseAnchor();this.requestedPlace=false;
  const point=this.placement.position!;this.floorRoot.position.set(point.x,point.y,point.z);
  const tracked=this.trackedFrames>=15;
  this.floorRoot.visible=!!this.model&&!this.state.loading&&!this.state.modelError&&tracked;
  this.update({anchor:'world',tracking:tracked,modelVisible:this.floorRoot.visible,message:tracked?'Showing the saved floor position without a device anchor. Rescan if it drifts.':'Tracking paused. Hold still to recover the saved floor position.'});
 }
 rotate(degrees:number){if(this.placement.isPlaced&&this.state.tracking){this.yaw+=degrees*Math.PI/180;this.floorRoot.rotation.y=this.yaw}}
 private referenceReset=()=>{this.reposition();this.trackedFrames=0;this.update({tracking:false,message:'The room reference changed. Scan the floor and place the piece again.'})};
 private frame=(time:number,frame?:XRFrame)=>{
  if(!frame||!this.space||!this.renderer||this.closed)return;
  const pose=frame.getViewerPose(this.space);
  const tracked=!!pose&&!pose.emulatedPosition&&this.session?.visibilityState==='visible';
  this.trackedFrames=tracked?this.trackedFrames+1:0;
  const goodTracking=this.trackedFrames>=15;
  if(!goodTracking){this.shutter?.('','Tracking paused. Try again when the furniture is visible.');this.shutter=null;this.floorRoot.visible=false;this.reticle.visible=false;this.placement.resetSamples();this.update({tracking:false,stable:false,modelVisible:false,message:'Tracking paused. Hold still and point at a well-lit, textured floor.'});this.renderer.render(this.scene,this.camera);return}
  const viewer=pose!.transform.position;
  if(!this.placement.isPlaced){
   const hit=frame.getHitTestResults(this.hitSource!)[0];const hitPose=hit?.getPose(this.space);
   const matrix=hitPose?.transform.matrix||null;
   const stable=this.placement.observe(matrix,time,viewer,true);
   const preview=this.placement.previewPoint;
   this.reticle.visible=!!preview;
   this.reticle.material.color.set(stable?'#bce49b':'#f1b94e');
   if(preview)this.reticle.position.set(preview.x,preview.y+.002,preview.z);
   if(preview)this.yaw=Math.atan2(viewer.x-preview.x,viewer.z-preview.z);
   const scanMessage=stable?'Green ring: tap Place here to show the furniture.':this.placement.hint==='no-surface'?'No floor detected yet. Slowly sweep over a textured floor, then pause.':this.placement.hint==='tilted'?'That surface is too steep. Point down at the floor.':this.placement.hint==='range'?'Aim at the floor about 0.5–2 metres in front of you.':'Amber ring: floor detected. Hold steady until it turns green.';
   this.update({tracking:true,stable,message:scanMessage});
  }
  if(this.requestedPlace&&this.placement.isPlaced){
   this.requestedPlace=false;const point=this.placement.position!;
   const sequence=++this.anchorSequence;
   // Create the anchor at the confirmed position, not at a new camera hit.
   // Attach to the actual floor surface when it still matches the tapped spot.
   // If the camera moved, keep the original point in the session space.
   if(frame.createAnchor){
    this.anchorPending=true;
    this.update({anchor:'creating'});
    try {
     const hit=this.hitSource ? frame.getHitTestResults(this.hitSource)[0] : undefined;
     const surface=hit?.getPose(this.space)?.transform;
     const near=surface && surface.matrix[5]>=.95 && Math.hypot(surface.position.x-point.x,surface.position.y-point.y,surface.position.z-point.z)<.015;
     const pending=near && hit?.createAnchor ? hit.createAnchor() : frame.createAnchor(new XRRigidTransform(point),this.space);
     pending.then(anchor=>{
      if(this.closed||sequence!==this.anchorSequence){anchor.delete();return}
      this.anchor=anchor;
     }).catch(()=>{if(!this.closed&&sequence===this.anchorSequence)this.showAtPlacedPosition()});
    }catch{this.showAtPlacedPosition()}
   }
  }
  let anchorLocated=false;
  if(this.placement.isPlaced&&this.anchor){
   let anchorPose:XRPose|null=null;
   try{if(!frame.trackedAnchors||frame.trackedAnchors.has(this.anchor))anchorPose=frame.getPose(this.anchor.anchorSpace,this.space)||null}catch{/* An anchor may be unlocatable for a frame. */}
   anchorLocated=!!anchorPose&&!anchorPose.emulatedPosition;
   if(anchorLocated){const p=anchorPose!.transform.position;this.placement.updateAnchor({x:p.x,y:p.y,z:p.z});this.floorRoot.position.set(p.x,p.y,p.z);this.anchorSeen=true;this.anchorPending=false;this.update({anchor:'tracked'})}
  }
  const positionUsable=!this.anchorSeen||anchorLocated;
  this.floorRoot.visible=this.placement.isPlaced&&!!this.model&&positionUsable&&!this.state.loading&&!this.state.modelError;
  if(this.placement.isPlaced)this.update({tracking:positionUsable,modelVisible:this.floorRoot.visible,message:!positionUsable?'Floor anchor tracking lost. Recover tracking or tap Show at saved position.':this.anchorSeen?'Floor anchor tracked. Position stays fixed while you resize.':this.anchorPending?'Locating floor anchor. Keep the floor spot in view.':'Showing the saved floor position. Use Reposition if it drifts.'});
  if(this.shutter){
   const finish=this.shutter;this.shutter=null;
   try{
    if(!this.floorRoot.visible)throw new Error('Wait until the furniture is visible.');
    finish(roomPhoto(this.renderer,this.scene,pose!.views[0]),'');
   }catch(error){finish('',error instanceof Error?error.message:'Use the tablet screenshot option.')}
  }
  this.renderer.render(this.scene,this.camera);
 };
 private ended=()=>{this.cleanup();this.update({...initialGroundState,loading:false})};
 private cleanup(){if(this.closed)return;this.closed=true;this.loadSequence++;this.anchorSequence++;this.hitSource?.cancel();this.hitSource=null;this.releaseAnchor();this.space?.removeEventListener('reset',this.referenceReset);this.session?.removeEventListener('end',this.ended);this.renderer?.setAnimationLoop(null);this.renderer?.domElement.remove();this.renderer?.dispose();this.renderer=null;disposeTree(this.floorRoot);this.reticle.geometry.dispose();this.reticle.material.dispose();this.scene.traverse(object=>{if(object instanceof DirectionalLight)object.shadow.dispose()});this.model=null;this.session=null}
 async stop(){const session=this.session;this.cleanup();if(session)try{await session.end()}catch{}this.update({...initialGroundState,loading:false})}
}

