import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loungeParts,loungeStandard,loungeLegCount,lockLoungeConfiguration,loungeErrors,loungeLegHeight,loungeSeatCount,LOUNGE_RECIPE} from '../src/services/loungeRecipe.ts';
import {createLoungeScene,loungeGLB} from '../src/services/loungeModel.ts';
import {validConfiguration,lockConfiguration,standardDimensions} from '../src/services/nightstandRecipe.ts';
import {furnitureDesign,configurationStorageKey} from '../src/services/furnitureDesign.ts';
import {createDemoOrderReview,saveDemoOrders,readDemoOrders,demoOrderPacketHTML} from '../src/services/demoOrders.ts';
import {addCartLine} from '../src/services/cart.ts';
const chair={id:'solace-lounge-chair',name:'Solace Lounge Chair',manufacturer:{name:'Atelier'},stock:8,price:32900,currency:'INR',colours:[{name:'Natural'},{name:'Forest'},{name:'Charcoal'}]};
const nook={id:'nook-nightstand',name:'Nook',manufacturer:{name:'Atelier'},stock:10,price:12900,currency:'INR',colours:[{name:'Natural'}]};
function bounds(scene,d){const box=new Box3().setFromObject(scene,true),size=box.getSize(new Vector3());for(const [a,b] of [[size.x,d.width/1000],[size.y,d.height/1000],[size.z,d.depth/1000],[box.min.y,0]])assert(Math.abs(a-b)<.00003,`${a} differs from ${b}`)}
test('the lounge chair has exact real-surface bounds and ground contact across its own limits',()=>{for(const d of [loungeStandard,{width:880,height:748,depth:756},{width:2024,height:928,depth:1008},{width:1499,height:825,depth:930}]){const scene=createLoungeScene(d,'Forest');bounds(scene,d);assert.equal(scene.scale.x,1);assert.equal(loungeParts(d).filter(p=>p.kind==='leg').length,loungeLegCount(d));assert.equal(loungeParts(d).find(p=>p.id==='F01').size.height,18);assert.equal(loungeParts(d).find(p=>p.id==='L01').size.height,loungeLegHeight(d))}});
test('chair limits, recipes, finishes and saved configuration keys stay separate from the nightstand',()=>{const c=lockLoungeConfiguration(loungeStandard,'Forest');assert(validConfiguration(c));assert.equal(furnitureDesign(c.productId).standard.width,880);assert.equal(furnitureDesign('nook-nightstand').standard.width,500);assert.notEqual(configurationStorageKey(c.productId),configurationStorageKey('nook-nightstand'));assert.throws(()=>lockLoungeConfiguration(standardDimensions,'Forest'));assert.throws(()=>lockLoungeConfiguration(loungeStandard,'Walnut'));assert(loungeErrors({...loungeStandard,width:2025}).length);assert(!validConfiguration({...c,productId:'nook-nightstand'}));assert.equal(loungeLegCount({...loungeStandard,width:1200}),4);assert.equal(loungeLegCount({...loungeStandard,width:1201}),6)});
test('chair GLB export preserves its measured bounds and selected upholstery colour',async()=>{globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.()})}};const data=await loungeGLB(loungeStandard,'Forest'),gltf=await new GLTFLoader().parseAsync(data,'');bounds(gltf.scene,loungeStandard);let material;gltf.scene.traverse(o=>{if(o.material?.name==='Fabric_Main')material=o.material});assert.equal(material.color.getHexString(),'36594d');assert.equal(gltf.scene.children[0].userData.recipeVersion,LOUNGE_RECIPE)});
test('the same bag and simulated payment preserve each furniture type and download its own blueprint',()=>{const c=lockLoungeConfiguration({width:1720,height:900,depth:950},'Forest'),n=lockConfiguration(standardDimensions,'Natural');let cart=addCartLine([],chair,'Forest',1,c);cart=addCartLine(cart,nook,'Natural',1,n);assert.equal(cart.length,2);const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};const orders=saveDemoOrders([createDemoOrderReview(chair,c,1),createDemoOrderReview(nook,n,1)],storage);assert.equal(readDemoOrders(storage).length,2);const packet=demoOrderPacketHTML(orders[0]);assert(packet.includes('Solace Lounge Chair'));assert(packet.includes('1720 W × 950 D × 900 H mm'));assert(packet.includes('6 tapered legs'));assert(packet.includes('U05'));assert(packet.includes('F13'));assert(packet.includes('upholstery'));assert(!packet.includes('Drawer front'));assert(demoOrderPacketHTML(orders[1]).includes('Drawer front'));c.dimensions.width=740;assert.equal(orders[0].configuration.dimensions.width,1720)});


test('X length rebuilds one or two seat sets while every arm component stays rigid',()=>{
 const original=loungeParts(loungeStandard);
 for(const x of [1,1.1,2,2.2])for(const y of [.9,1,1.1,1.2]){
  const d={...loungeStandard,width:Math.round(880*x),depth:Math.round(840*y)},parts=loungeParts(d);
  bounds(createLoungeScene(d),d);
  assert.equal(parts.filter(p=>p.name.startsWith('Seat cushion')).length,x<2?1:2);
  assert.equal(parts.filter(p=>p.name.startsWith('Back cushion')).length,x<2?1:2);
  for(const id of ['U02','U03','F08','F09','F10','F11','F12','F13']){
   const part=parts.find(p=>p.id===id),ref=original.find(p=>p.id===id);
   assert.deepEqual(part.size,ref.size);assert.equal(part.rotationX,ref.rotationX);
  }
  const seats=parts.filter(p=>p.name.startsWith('Seat cushion')).sort((a,b)=>a.centre.x-b.centre.x);
  assert.equal(seats.reduce((total,p)=>total+p.size.width,0)+(seats.length===2?12:0),d.width-220);
  assert.equal(parts.find(p=>p.id==='U02').centre.x,-d.width/2+55);
  assert.equal(parts.find(p=>p.id==='U03').centre.x,d.width/2-55);
 }
 assert.equal(loungeSeatCount({...loungeStandard,width:1499}),1);
 assert.equal(loungeSeatCount({...loungeStandard,width:1500}),2);
});

test('height changes only the legs and translates every body component by the leg-height difference',()=>{
 const original=loungeParts(loungeStandard);
 for(const height of [748,780,928]){
  const d={...loungeStandard,width:1720,height},baseline=loungeParts({...d,height:880}),parts=loungeParts(d);
  bounds(createLoungeScene(d),d);
  for(const part of parts){
   const ref=baseline.find(p=>p.id===part.id);
   if(part.kind==='leg'){assert.equal(part.size.height,height-628);assert.equal(part.centre.y-part.size.height/2,0);assert.equal(part.centre.y+part.size.height/2,height-628)}
   else{assert.deepEqual(part.size,ref.size);assert.equal(part.rotationX,ref.rotationX);assert.equal(part.centre.y-ref.centre.y,height-880);assert.equal(part.centre.x,ref.centre.x);assert.equal(part.centre.z,ref.centre.z)}
  }
 }
 for(const width of [1200,1201,1800,1801,1978])assert.equal(loungeParts({...loungeStandard,width}).filter(p=>p.kind==='leg').length,width<=1200?4:width<=1800?6:8);
});

test('two-seat exports, demo order snapshots and workshop schedules agree on the new recipe',async()=>{
 const d={width:2024,height:928,depth:1008},data=await loungeGLB(d,'Charcoal'),loaded=await new GLTFLoader().parseAsync(data,'');bounds(loaded.scene,d);
 assert(loaded.scene.getObjectByName('U07_Seat_cushion_2'));assert(loaded.scene.getObjectByName('U08_Back_cushion_2'));
 const mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};
 const c=lockLoungeConfiguration(d,'Charcoal'),o=saveDemoOrders([createDemoOrderReview(chair,c,2)],storage)[0],packet=demoOrderPacketHTML(o);
 assert(packet.includes('8 tapered legs, 300 mm nominal length'));assert(packet.includes('Seat top is nominally 598 mm'));assert(packet.includes('110 × 396 × 740 mm'));assert(packet.includes('U07'));assert(packet.includes('U08'));assert(packet.includes('628 mm fixed body + leg height'));
 c.dimensions.height=820;assert.equal(o.configuration.dimensions.height,928);
 const old={...lockLoungeConfiguration(loungeStandard,'Natural'),recipeVersion:'solace-concept-v1',dimensions:{width:1050,height:900,depth:950}};
 assert(validConfiguration(old));const legacyPacket=demoOrderPacketHTML(saveDemoOrders([createDemoOrderReview(chair,old,1)],storage)[0]);assert(legacyPacket.includes('6 tapered legs, 180 mm nominal length'));assert(legacyPacket.includes('Legacy recipe'));assert(!legacyPacket.includes('U07'));
});
