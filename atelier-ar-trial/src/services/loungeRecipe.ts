import type {Dimensions,FurnitureConfiguration} from '../types/product';
import {legacyLoungeParts,legacyLoungeErrors,legacyLoungeLegCount} from './loungeLegacy.ts';
export const LOUNGE_RECIPE='solace-concept-v3';
export const loungeStandard:Dimensions={width:880,height:780,depth:840};
// Dimensions remain actual outer X / vertical Y / front-to-back Z for AR and orders.
// The customer controls call these length X, width Y and leg height.
export const loungeBodyHeight=628;
export const loungeLimits={width:{min:880,max:2024},height:{min:748,max:928},depth:{min:756,max:1008}};
export const loungeFinishes=[{name:'Natural',hex:'#c1b195'},{name:'Forest',hex:'#36594d'},{name:'Charcoal',hex:'#454b50'}];
export interface LoungePart {id:string;name:string;kind:'frame'|'upholstery'|'leg';size:Dimensions;centre:{x:number;y:number;z:number};rotationX:number;radius:number;material:'frame'|'fabric'}
export function loungeErrors(d:Dimensions){return (Object.keys(loungeLimits) as (keyof Dimensions)[]).flatMap(axis=>!Number.isInteger(d[axis])||d[axis]<loungeLimits[axis].min||d[axis]>loungeLimits[axis].max?[`${axis}: enter ${loungeLimits[axis].min}–${loungeLimits[axis].max} mm.`]:[])}
function previousErrors(d:Dimensions){
 return Number.isInteger(d.width)&&d.width>=860&&d.width<=1978&&Number.isInteger(d.height)&&d.height>=820&&d.height<=1000&&Number.isInteger(d.depth)&&d.depth>=810&&d.depth<=1080?[]:['Invalid previous configuration'];
}
export const loungeLegHeight=(d:Dimensions)=>d.height-loungeBodyHeight;
export const loungeSeatCount=(d:Dimensions)=>d.width>=1500?2:1;
export const loungeLegCount=(d:Dimensions,version:string=LOUNGE_RECIPE)=>version==='solace-concept-v1'?legacyLoungeLegCount(d):d.width>1800?8:d.width>1200?6:4;
export function loungeParts(d:Dimensions,version:string=LOUNGE_RECIPE):LoungePart[]{
 if(version==='solace-concept-v1')return legacyLoungeParts(d);
 const previous=version==='solace-concept-v2';
 if(!previous&&version!==LOUNGE_RECIPE)throw new Error('Unsupported lounge recipe');
 const errors=previous?previousErrors(d):loungeErrors(d);if(errors.length)throw new Error(errors.join(' '));
 const {width:w,depth:z}=d,legHeight=previous?d.height-700:loungeLegHeight(d),rise=legHeight-180;
 const angle=-Math.PI/20,armTop=634,backHeight=previous?452:380;
 const backExtentY=backHeight*Math.cos(angle)+160*Math.abs(Math.sin(angle)),backExtentZ=backHeight*Math.abs(Math.sin(angle))+160*Math.cos(angle);
 const uprightHeight=previous?580:508;
 const armShift=previous?0:Math.min(0,z-810);
 const backY=(previous?880:808)-backExtentY/2,backZ=-z/2+backExtentZ/2;
 const parts:LoungePart[]=[];
 const add=(id:string,name:string,kind:LoungePart['kind'],width:number,height:number,depth:number,x:number,y:number,zz:number,radius=5,rotationX=0)=>parts.push({id,name,kind,size:{width,height,depth},centre:{x,y:y+(kind==='leg'?0:rise),z:zz},rotationX,radius,material:kind==='upholstery'?'fabric':'frame'});
 add('F01','Seat platform','frame',w-40,18,z-100,0,229,0);
 add('F02','Front frame rail','frame',w-160,40,40,0,200,z/2-110);
 add('F03','Rear frame rail','frame',w-160,40,40,0,200,-z/2+110);
 add('F04','Left frame rail','frame',40,40,z-260,-w/2+100,200,0);
 add('F05','Right frame rail','frame',40,40,z-260,w/2-100,200,0);
 for(const [index,x] of [-w/2+190,w/2-190].entries())add(`F0${6+index}`,`${index?'Right':'Left'} back upright`,'frame',40,uprightHeight,40,x,240+(uprightHeight*Math.cos(angle)+40*Math.abs(Math.sin(angle)))/2,-z/2+100,4,angle);
 // Both arm assemblies are rigid; they translate with the outer sides and back.
 let id=8;for(const x of [-w/2+55,w/2-55])for(const zz of [-z/2+130+armShift,-z/2+750+armShift])add(`F${String(id++).padStart(2,'0')}`,'Arm support post','frame',40,armTop-268,40,x,238+(armTop-268)/2,zz);
 for(const [index,x] of [-w/2+55,w/2-55].entries())add(`F${12+index}`,'Arm cap rail','frame',60,30,640,x,armTop-45,-z/2+440+armShift);
 add('U01','Upholstered seat base','upholstery',w-80,90,z-100,0,283,50,35);
 add('U02','Left upholstered arm','upholstery',110,396,740,-w/2+55,436,-z/2+440+armShift,50);
 add('U03','Right upholstered arm','upholstery',110,396,740,w/2-55,436,-z/2+440+armShift,50);
 add('U04','Reclined back body','upholstery',w-100,backHeight,160,0,backY,backZ,55,angle);
 const seats=loungeSeatCount(d),gap=seats===2?12:0,cushionWidth=(w-220-gap)/seats;
 for(let seat=0;seat<seats;seat++){
  const x=seats===1?0:(seat===0?-1:1)*(cushionWidth+gap)/2;
  add(seat===0?'U05':'U07',`Seat cushion ${seat+1}`,'upholstery',cushionWidth,150,z-(previous?300:240),x,403,previous?150:120,60);
  add(seat===0?'U06':'U08',`Back cushion ${seat+1}`,'upholstery',cushionWidth,backHeight-70,120,x,backY+20,backZ+80,50,angle);
 }
 // Every support stays on the floor, and all tops stay under the frame.
 let leg=1;const legXs=[-w/2+100,w/2-100];
 if(loungeLegCount(d)===6)legXs.push(0);
 if(loungeLegCount(d)===8)legXs.push(-(w-200)/6,(w-200)/6);
 for(const x of legXs)for(const zz of [-z/2+110,z/2-110])add(`L${String(leg++).padStart(2,'0')}`,Math.abs(x)===w/2-100?'Tapered timber leg':'Centre support leg','leg',55,legHeight,55,x,legHeight/2,zz);
 return parts;
}
export function lockLoungeConfiguration(d:Dimensions,finish:string):FurnitureConfiguration {
 loungeParts(d);if(!loungeFinishes.some(option=>option.name===finish))throw new Error('Unsupported chair finish');
 return {id:crypto.randomUUID(),recipeVersion:LOUNGE_RECIPE,productId:'solace-lounge-chair',dimensions:{...d},finish,material:'Upholstery and timber frame concept',panelThickness:18,lockedAt:new Date().toISOString(),status:'draft-needs-manufacturer-review',pricing:'quote-required'};
}
export function validLoungeConfiguration(c:unknown):c is FurnitureConfiguration {
 if(!c||typeof c!=='object')return false;const value=c as FurnitureConfiguration;
 return value.productId==='solace-lounge-chair'&&[LOUNGE_RECIPE,'solace-concept-v2','solace-concept-v1'].includes(value.recipeVersion)&&typeof value.id==='string'&&value.id.length>0&&!!value.dimensions&&!(value.recipeVersion==='solace-concept-v1'?legacyLoungeErrors(value.dimensions):value.recipeVersion==='solace-concept-v2'?previousErrors(value.dimensions):loungeErrors(value.dimensions)).length&&loungeFinishes.some(option=>option.name===value.finish)&&value.panelThickness===18&&value.status==='draft-needs-manufacturer-review'&&value.pricing==='quote-required';
}
