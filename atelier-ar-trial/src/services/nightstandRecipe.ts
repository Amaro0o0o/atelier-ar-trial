import {validLoungeConfiguration} from './loungeRecipe.ts';
import type {Dimensions,FurnitureConfiguration} from '../types/product';
export const NIGHTSTAND_RECIPE='nook-concept-v3';
export const standardDimensions:Dimensions={width:500,height:550,depth:400};
export const dimensionLimits={width:{min:400,max:700},height:{min:450,max:750},depth:{min:300,max:550}};
export const supportLegThreshold=600;
export function scaledAxis(d:Dimensions,axis:keyof Dimensions,factor:number):Dimensions{return {...d,[axis]:Math.round(d[axis]*factor)}}
export function supportLegCount(d:Dimensions,version: FurnitureConfiguration['recipeVersion']=NIGHTSTAND_RECIPE){return version==='nook-concept-v3'&&d.width>supportLegThreshold?6:4}
export type PartMaterial='wood'|'interior'|'brass';
export interface NightstandPart {name:string;shape:'panel'|'leg'|'pull';size:Dimensions;centre:{x:number;y:number;z:number};material:PartMaterial;quantity:number}
export function dimensionErrors(d:Dimensions):string[]{return (Object.keys(dimensionLimits) as (keyof Dimensions)[]).flatMap(axis=>{const value=d[axis],range=dimensionLimits[axis];return !Number.isFinite(value)||!Number.isInteger(value)||value<range.min||value>range.max?[`${axis}: enter a whole number from ${range.min} to ${range.max} mm.`]:[]})}
export function sameDimensions(a:Dimensions,b:Dimensions){return a.width===b.width&&a.height===b.height&&a.depth===b.depth}
export function resizedDimensions(d:Dimensions,factor:number):Dimensions{return {width:Math.round(d.width*factor),height:Math.round(d.height*factor),depth:Math.round(d.depth*factor)}}
export function nightstandParts(d:Dimensions,version: FurnitureConfiguration['recipeVersion']=NIGHTSTAND_RECIPE):NightstandPart[]{
 const errors=dimensionErrors(d);if(errors.length)throw new Error(errors.join(' '));
 const {width:w,height:h,depth:z}=d,panel=18,leg=150,innerW=w-2*panel;
 const clearH=h-leg-3*panel,opening=clearH/2,shelfY=leg+panel+opening+panel/2;
 const drawerW=innerW-24,drawerD=z-52,frontH=opening-6,baseY=shelfY+panel/2+12,drawerH=frontH-36;
 const parts:NightstandPart[]=[];
 const add=(name:string,width:number,height:number,depth:number,x:number,y:number,zz:number,material:PartMaterial='wood',shape:NightstandPart['shape']='panel')=>parts.push({name,shape,size:{width,height,depth},centre:{x,y,z:zz},material,quantity:1});
 add('Top',w,panel,z,0,h-panel/2,0);
 add('Left side',panel,h-leg-panel,z,-w/2+panel/2,(leg+h-panel)/2,0);
 add('Right side',panel,h-leg-panel,z,w/2-panel/2,(leg+h-panel)/2,0);
 add('Bottom',innerW,panel,z,0,leg+panel/2,0);
 add('Rear panel',innerW,h-leg-2*panel,panel,0,(leg+panel+h-panel)/2,-z/2+panel/2,'interior');
 add('Support shelf',innerW,panel,z-panel,0,shelfY,panel/2);
 add('Drawer front',innerW-6,frontH,14,0,shelfY+panel/2+3+frontH/2,z/2-7);
 add('Drawer base',drawerW,12,drawerD,0,baseY,0,'interior');
 add('Drawer left',12,drawerH,drawerD,-drawerW/2+6,baseY+6+drawerH/2,0,'interior');
 add('Drawer right',12,drawerH,drawerD,drawerW/2-6,baseY+6+drawerH/2,0,'interior');
 add('Drawer back',drawerW-24,drawerH,12,0,baseY+6+drawerH/2,-drawerD/2+6,'interior');
 for(const x of [-w/2+55,w/2-55])for(const zz of [-z/2+55,z/2-55])add(`Leg ${parts.filter(p=>p.shape==='leg').length+1}`,44,leg,44,x,leg/2,zz,'wood','leg');
 if(supportLegCount(d,version)===6)for(const zz of [-z/2+55,z/2-55])add(`Centre support leg ${parts.filter(p=>p.shape==='leg').length-3}`,44,leg,44,0,leg/2,zz,'wood','leg');
 add('Recessed brass pull',102,8,2,0,shelfY+panel/2+3+frontH*.7,z/2-1,'brass','pull');
 return parts;
}
export function lockConfiguration(d:Dimensions,finish:string):FurnitureConfiguration{
 if(!['Natural','Walnut','Charcoal'].includes(finish))throw new Error('Unsupported finish');
 nightstandParts(d);
 return {id:crypto.randomUUID(),recipeVersion:NIGHTSTAND_RECIPE,productId:'nook-nightstand',dimensions:{...d},finish,material:'Oak concept finish',panelThickness:18,lockedAt:new Date().toISOString(),status:'draft-needs-manufacturer-review',pricing:'quote-required'};
}
export function validConfiguration(c:unknown):c is FurnitureConfiguration{if(!c||typeof c!=='object')return false;const v=c as FurnitureConfiguration;if(v.productId==='solace-lounge-chair')return validLoungeConfiguration(v);return v.productId==='nook-nightstand'&&['nook-concept-v2',NIGHTSTAND_RECIPE].includes(v.recipeVersion)&&typeof v.id==='string'&&v.id.length>0&&!!v.dimensions&&dimensionErrors(v.dimensions).length===0&&['Natural','Walnut','Charcoal'].includes(v.finish)&&v.panelThickness===18&&v.status==='draft-needs-manufacturer-review'&&v.pricing==='quote-required'}
