import {useEffect,useRef,useState} from 'react';
import {Camera,ExternalLink,X,MapPin,RotateCcw,RotateCw,ScanLine,SlidersHorizontal,Palette,Move,Info,ChevronDown,Check,ShoppingBag} from 'lucide-react';
import {browserARProbe,detectARSupport,supportMessages,type ARSupport} from '../services/arSupport';
import {GroundedAR,initialGroundState,type GroundState} from '../services/groundedAR';
import SizingControls from './SizingControls';
import {ARDemoOrderReview,ARDemoOrderReceipt} from './ARDemoOrder';
import {createDemoOrderReview,readDemoOrders,saveDemoOrder,type DemoOrderReview,type DemoOrder} from '../services/demoOrders';
import type {Product} from '../types/product';
import type {SizingProps} from './SizingControls';
const secureOrigin=new URL('.',window.location.href).href;
const defaultFinishes=[{name:'Natural',hex:'#bc9164'},{name:'Walnut',hex:'#705039'},{name:'Charcoal',hex:'#424744'}];
export default function ARRoomViewer({url,finish,onFinish,dimensions,configuration,busy=false,configurable=false,orderProduct,orderQuantity=1,onDimensionsChange,onLockSize,onUnlockSize}:{url:string;finish:string;onFinish?:(value:string)=>void;configurable?:boolean;orderProduct?:Product;orderQuantity?:number}&SizingProps){
 const overlay=useRef<HTMLDivElement>(null),engine=useRef<GroundedAR|null>(null),mounted=useRef(true);
 const [ground,setGround]=useState<GroundState>({...initialGroundState});
 const [tool,setTool]=useState<'size'|'finish'|'move'|'info'|'order'|'photo'|null>(null);
 const [review,setReview]=useState<DemoOrderReview|null>(null),[orderError,setOrderError]=useState(''),[pendingLock,setPendingLock]=useState(false),[checkoutComplete,setCheckoutComplete]=useState(false);
 const [lastOrder,setLastOrder]=useState<DemoOrder|null>(()=>readDemoOrders().find(order=>order.productId===orderProduct?.id)||null);
 const [photo,setPhoto]=useState(''),[photoMessage,setPhotoMessage]=useState(''),[clean,setClean]=useState(false);
 useEffect(()=>{if(ground.phase!=='placed')setClean(false)},[ground.phase]);
 function takePhoto(){
  setPhoto('');setPhotoMessage('Taking photo…');
  engine.current?.takePhoto((image,message)=>{if(mounted.current){setPhoto(image);setPhotoMessage(message)}});
 }
 const confirming=useRef(false);
 useEffect(()=>{if(ground.phase!=='placed'){setTool(null);setPendingLock(false)}},[ground.phase]);
 function openOrderReview(saved:NonNullable<SizingProps['configuration']>){if(!orderProduct)return;try{setReview(createDemoOrderReview(orderProduct,saved,orderQuantity));setCheckoutComplete(false);setOrderError('');setTool('order')}catch(reason){setOrderError(reason instanceof Error?reason.message:'The demo order could not be prepared.')}}
 useEffect(()=>{if(pendingLock&&configuration){setPendingLock(false);openOrderReview(configuration)}},[pendingLock,configuration]);
 useEffect(()=>{if(review&&!checkoutComplete&&review.configuration.id!==configuration?.id){setReview(null);setTool(null)}},[configuration?.id]);
 function startOrder(){setOrderError('');setCheckoutComplete(false);setReview(null);setTool('order');if(configuration){openOrderReview(configuration);return}setTool('order');setPendingLock(true);try{if(!onLockSize)throw new Error('Size locking is unavailable for this piece.');onLockSize()}catch(reason){setPendingLock(false);setOrderError(reason instanceof Error?reason.message:'Could not lock this size.')}}
 function confirmOrder(){if(!review||confirming.current||review.configuration.id!==configuration?.id)return;confirming.current=true;try{const saved=saveDemoOrder(review);setLastOrder(saved);setCheckoutComplete(true);setOrderError('')}catch(reason){setOrderError(reason instanceof Error?reason.message:'The demo order could not be saved.')}finally{confirming.current=false}}

 const [support,setSupport]=useState<ARSupport>('checking'),[checking,setChecking]=useState(0),[error,setError]=useState('');
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;void engine.current?.stop();engine.current=null}},[]);
 useEffect(()=>{let active=true;setSupport('checking');detectARSupport(browserARProbe()).then(value=>{if(active)setSupport(value)});return()=>{active=false}},[checking]);
 useEffect(()=>{if(ground.phase!=='idle')void engine.current?.setModel(url,finish)},[url,finish]);
 useEffect(()=>{document.getElementById('room-placement')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})},[]);
 async function launch(){if(!overlay.current||ground.phase!=='idle')return;setError('');const next=new GroundedAR(state=>{if(mounted.current)setGround(state)});engine.current=next;try{await next.start(overlay.current,url,finish)}catch(reason){if(mounted.current)setError(reason instanceof Error?reason.message:'Room tracking could not start. Open directly in Android Chrome and check AR support.')}}
 const finishes=orderProduct?.colours||defaultFinishes;
 const securePreview=secureOrigin+'#/product/'+(orderProduct?.id||'nook-nightstand');
 const active=ground.phase!=='idle',placed=ground.phase==='placed',message=supportMessages[support];
 const showNotice=!placed||!ground.tracking||ground.loading||!!ground.modelError;
 const toolLabels={photo:'Room photo',size:'Adjust size',finish:'Choose finish',move:'Position & rotation',info:'Placement details',order:checkoutComplete?'Demo order confirmation':'Review demo order'};
 const dockTools=[{key:'size',label:'Size',Icon:SlidersHorizontal},{key:'finish',label:'Finish',Icon:Palette},{key:'move',label:'Move',Icon:Move},{key:'info',label:'Info',Icon:Info}] as const;
 return <section id="room-placement" className="ar-room grounded-room" aria-label="Place furniture in your room">
  <div className="eyebrow">FLOOR-FIRST ROOM PLACEMENT</div><h2>Place it. Then walk around it.</h2><p>Scan an empty, well-lit floor spot. Hold the device steady until the amber ring turns green, then tap <strong>Place here</strong>. The model stays at that floor position while you walk around it. It moves again only when you choose <strong>Reposition</strong>.</p>
  <ol className="floor-placement-steps"><li><ScanLine size={22}/><strong>1 · Find the floor</strong><span>Hold steady over one textured floor spot.</span></li><li><MapPin size={22}/><strong>2 · Place here</strong><span>Confirm the ring is on the floor, not a table.</span></li><li><Camera size={22}/><strong>3 · Check your fit</strong><span>{configurable?'Walk slowly around it and resize each axis.':'Walk around the sofa to check its footprint.'}</span></li></ol>
  <div className="ar-launch-row"><button className="button" disabled={support!=='available'||active||busy} onClick={launch}><Camera size={17}/>{active?'AR session open':support==='checking'?'Checking AR support…':'View in your room'}</button><span className="small muted">Place on a detected floor</span></div>
  <div className="ar-notice" role="status"><strong>{message.title}</strong><p>{message.body}</p><div className="ar-help-actions"><button className="text-link" onClick={()=>{setError('');setChecking(x=>x+1)}}>Check again</button><a className="text-link" href={securePreview} target="_blank" rel="noreferrer">Open directly in Chrome <ExternalLink size={14}/></a><a className="text-link" href="https://developers.google.com/ar/devices" target="_blank" rel="noreferrer">Supported devices <ExternalLink size={14}/></a></div></div>
  {!active&&lastOrder&&<div className="ar-latest-order"><ARDemoOrderReceipt order={lastOrder}/></div>}
  <details className="ar-diagnostics"><summary>AR compatibility details</summary><dl><div><dt>Secure HTTPS</dt><dd>{window.isSecureContext?'Yes':'No'}</dd></div><div><dt>Compatibility</dt><dd>{support}</dd></div><div><dt>Placement</dt><dd>{ground.phase}</dd></div><div><dt>Floor anchor</dt><dd>{ground.anchor}</dd></div></dl></details>
  {error&&<p role="alert" className="ar-notice">{error}</p>}<p className="small muted">A device anchor is used when available. If the device cannot provide anchors, the object uses a fixed world position. Tracking can still drift on featureless floors or in poor light. Furniture hides when tracking is lost; a room-reference reset requires placement again. Check final fit with a tape measure.</p>
  <div ref={overlay} className={active?'ground-overlay active':'ground-overlay'} aria-label="AR floor placement controls" data-pointer-coalesce="">
   {clean?<button className="photo-return" aria-label="Restore AR controls" onClick={()=>setClean(false)}/>:<>
   <div className="ground-topbar"><span><MapPin size={16}/> {placed?(ground.anchor==='tracked'&&ground.tracking?'Floor anchored':ground.anchor==='creating'?'Locating floor anchor':'Estimated position'):'Scan floor'}</span>{placed&&<button onClick={()=>setTool(tool==='photo'?null:'photo')}><Camera size={18}/> Photo</button>}<button aria-label={placed?'Done, exit AR':'Exit AR'} onClick={()=>void engine.current?.stop()}>{placed?<Check size={18}/>:<X size={18}/>} {placed?'Done':'Exit AR'}</button></div>
   {showNotice&&<div className={`ground-brief-notice ${ground.tracking?'':'paused'}`} role="status"><strong>{ground.modelError?'Model could not load':ground.loading?'Loading furniture…':!ground.tracking?'Tracking paused':ground.stable?'Floor ready — tap Place here':'Find a floor spot'}</strong><span>{ground.modelError||ground.message}</span>{ground.modelError&&<button className="ground-mini-retry" onClick={()=>void engine.current?.setModel(url,finish)}>Retry model</button>}</div>}
   {!placed&&<div className="ground-place-action"><button className="button" disabled={!ground.stable||!ground.tracking||ground.loading||!!ground.modelError||busy} onClick={()=>engine.current?.place()}><MapPin size={18}/> Place here</button><p>Point at the floor. Amber means detected; green means ready.</p></div>}
   {placed&&<>
    {tool&&<section className="ground-tool-sheet" id="ar-tool-panel" aria-label={toolLabels[tool]}><div className="ground-tool-heading"><h3>{toolLabels[tool]}</h3><button aria-label="Close AR tools" onClick={()=>setTool(null)}><ChevronDown size={20}/><span>Close</span></button></div><div className={tool==='order'&&!checkoutComplete?'ground-tool-body ground-order-body':'ground-tool-body'}>
     {tool==='order'&&(checkoutComplete&&lastOrder?<ARDemoOrderReceipt order={lastOrder} onClose={()=>setTool(null)}/>:review?<ARDemoOrderReview review={review} error={orderError} disabled={busy||ground.loading||!!ground.modelError||review.configuration.id!==configuration?.id} onQuantity={quantity=>setReview(current=>current?{...current,quantity}:current)} onConfirm={confirmOrder} onEdit={()=>{setReview(null);onUnlockSize?.();setTool('size')}}/>:<div className="ar-order-review"><p>{orderError||'Saving your size for this demo order…'}</p>{orderError&&<button className="ar-confirm-order" onClick={startOrder}>Try again</button>}</div>)}
     {tool==='size'&&configurable&&<SizingControls productId={orderProduct?.id} compact dimensions={dimensions} configuration={configuration} busy={busy||ground.loading||!ground.tracking} onDimensionsChange={onDimensionsChange} onLockSize={()=>{onLockSize?.();setTool(null)}} onUnlockSize={onUnlockSize}/>}
     {tool==='finish'&&<div className="ground-finish-options">{finishes.map(f=><button key={f.name} aria-label={`AR finish ${f.name}`} aria-pressed={finish===f.name} onClick={()=>{onFinish?.(f.name);setTool(null)}}><span style={{background:f.hex}}/>{f.name}{finish===f.name&&<Check size={16}/>}</button>)}</div>}
     {tool==='move'&&<div className="ground-move-options"><button onClick={()=>{engine.current?.reposition();setTool(null)}}><MapPin size={18}/> Reposition on floor</button><div><button aria-label="Rotate furniture left 15 degrees" disabled={!ground.tracking} onClick={()=>engine.current?.rotate(-15)}><RotateCcw size={18}/> Rotate left 15°</button><button aria-label="Rotate furniture right 15 degrees" disabled={!ground.tracking} onClick={()=>engine.current?.rotate(15)}><RotateCw size={18}/> Rotate right 15°</button></div></div>}
     {tool==='photo'&&<div className="ground-info-content">
      <button disabled={!ground.modelVisible||!ground.tracking} onClick={takePhoto}><Camera size={18}/> Take photo</button>
      {photoMessage&&<p role="status">{photoMessage}</p>}
      {photo&&<><img src={photo} alt="Your furniture placed in the room" style={{maxHeight:'18vh',maxWidth:'100%',objectFit:'contain'}}/><a className="button" href={photo} download="atelier-room.jpg">Save photo</a></>}
      <button onClick={()=>{setClean(true);setTool(null)}}>Hide controls for tablet screenshot</button>
      <p>On Android, press Power and Volume Down together to take a screenshot. Tap anywhere to restore the controls.</p>
     </div>}
     {tool==='info'&&<div className="ground-info-content"><p>{ground.message}</p><dl><div><dt>Model</dt><dd>{ground.modelError?'Load failed':ground.loading?'Loading':'Loaded'}</dd></div><div><dt>Rendering</dt><dd>{ground.modelVisible?'On':'Off'}</dd></div><div><dt>Position</dt><dd>{ground.anchor==='tracked'?'Device anchor':ground.anchor==='creating'?'Anchor pending':'Saved world position'}</dd></div><div><dt>Finish</dt><dd>{finish}</dd></div></dl><button onClick={()=>{engine.current?.showAtPlacedPosition();setTool(null)}}>Show at saved position</button></div>}
    </div></section>}
    <div className="ground-bottom-dock"><div className="ground-dock-summary"><div className="ground-order-size"><span>{dimensions.width} W × {dimensions.depth} D × {dimensions.height} H mm</span>{configuration&&<span className="ground-saved-label"><Check size={14}/> Saved</span>}</div>{configurable&&orderProduct&&<button className="ground-order-button" aria-expanded={tool==='order'} aria-controls="ar-tool-panel" aria-label={configuration?'Order this furniture size':'Lock this size and order'} disabled={busy||ground.loading||!!ground.modelError||!ground.tracking||!ground.modelVisible||!orderProduct.stock||pendingLock} onClick={startOrder}><ShoppingBag size={17}/>{configuration?'Order':'Lock & order'}</button>}</div><nav aria-label="AR tools">{dockTools.filter(item=>item.key!=='size'||configurable).map(({key,label,Icon})=><button key={key} aria-label={`AR ${label.toLowerCase()} tools`} aria-expanded={tool===key} aria-controls="ar-tool-panel" onClick={()=>setTool(current=>current===key?null:key)}><Icon size={20}/><span>{label}</span></button>)}</nav></div>
   </>}

  </>}</div>
 </section>
}
