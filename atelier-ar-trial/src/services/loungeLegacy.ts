import type {Dimensions} from '../types/product';
export const LEGACY_LOUNGE_RECIPE='solace-concept-v1';
export const legacyLoungeStandard:Dimensions={width:860,height:880,depth:900};
export const legacyLoungeLimits={width:{min:740,max:1120},height:{min:780,max:1000},depth:{min:780,max:1050}};
export const loungeFinishes=[{name:'Natural',hex:'#c1b195'},{name:'Forest',hex:'#36594d'},{name:'Charcoal',hex:'#454b50'}];
export interface LoungePart {id:string;name:string;kind:'frame'|'upholstery'|'leg';size:Dimensions;centre:{x:number;y:number;z:number};rotationX:number;radius:number;material:'frame'|'fabric'}
export function legacyLoungeErrors(d:Dimensions){return (Object.keys(legacyLoungeLimits) as (keyof Dimensions)[]).flatMap(axis=>!Number.isInteger(d[axis])||d[axis]<legacyLoungeLimits[axis].min||d[axis]>legacyLoungeLimits[axis].max?[`${axis}: enter ${legacyLoungeLimits[axis].min}–${legacyLoungeLimits[axis].max} mm.`]:[])}
export const legacyLoungeLegCount=(d:Dimensions)=>d.width>1000?6:4;
export function legacyLoungeParts(d:Dimensions):LoungePart[]{
 const errors=legacyLoungeErrors(d);if(errors.length)throw new Error(errors.join(' '));
 const {width:w,height:h,depth:z}=d,angle=-Math.PI/20,armTop=Math.round(h*.72),backHeight=h-428;
 const backExtentY=backHeight*Math.cos(angle)+160*Math.abs(Math.sin(angle)),backExtentZ=backHeight*Math.abs(Math.sin(angle))+160*Math.cos(angle);
 const backY=h-backExtentY/2,backZ=-z/2+backExtentZ/2;
 const parts:LoungePart[]=[];
 const add=(id:string,name:string,kind:LoungePart['kind'],width:number,height:number,depth:number,x:number,y:number,zz:number,radius=5,rotationX=0)=>parts.push({id,name,kind,size:{width,height,depth},centre:{x,y,z:zz},rotationX,radius,material:kind==='upholstery'?'fabric':'frame'});
 add('F01','Seat platform','frame',w-40,18,z-100,0,229,0);
 add('F02','Front frame rail','frame',w-160,40,40,0,200,z/2-110);
 add('F03','Rear frame rail','frame',w-160,40,40,0,200,-z/2+110);
 add('F04','Left frame rail','frame',40,40,z-260,-w/2+100,200,0);
 add('F05','Right frame rail','frame',40,40,z-260,w/2-100,200,0);
 for(const [index,x] of [-w/2+190,w/2-190].entries())add(`F0${6+index}`,`${index?'Right':'Left'} back upright`,'frame',40,h-300,40,x,240+((h-300)*Math.cos(angle)+40*Math.abs(Math.sin(angle)))/2,-z/2+100,4,angle);
 let id=8;for(const x of [-w/2+55,w/2-55])for(const zz of [-z/2+110,z/2-110])add(`F${String(id++).padStart(2,'0')}`,'Arm support post','frame',40,armTop-268,40,x,238+(armTop-268)/2,zz);
 for(const [index,x] of [-w/2+55,w/2-55].entries())add(`F${12+index}`,'Arm cap rail','frame',60,30,z-150,x,armTop-45,0);
 add('U01','Upholstered seat base','upholstery',w-80,90,z-100,0,283,0,35);
 add('U02','Left upholstered arm','upholstery',110,armTop-238,z,-w/2+55,(238+armTop)/2,0,50);
 add('U03','Right upholstered arm','upholstery',110,armTop-238,z,w/2-55,(238+armTop)/2,0,50);
 add('U04','Reclined back body','upholstery',w-100,backHeight,160,0,backY,backZ,55,angle);
 add('U05','Seat cushion','upholstery',w-220,150,z-300,0,403,100,60);
 add('U06','Back cushion','upholstery',w-220,backHeight-70,120,0,backY+20,backZ+80,50,angle);
 let leg=1;for(const x of [-w/2+100,w/2-100])for(const zz of [-z/2+170,z/2-170])add(`L0${leg++}`,'Tapered timber leg','leg',55,180,55,x,90,zz);
 if(legacyLoungeLegCount(d)===6)for(const zz of [-z/2+110,z/2-110])add(`L0${leg++}`,'Centre support leg','leg',55,180,55,0,90,zz);
 return parts;
}
