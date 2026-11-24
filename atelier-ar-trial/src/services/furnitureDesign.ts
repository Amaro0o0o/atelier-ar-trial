import type {Dimensions} from '../types/product';
import {NIGHTSTAND_RECIPE,dimensionLimits,standardDimensions,dimensionErrors,lockConfiguration,supportLegCount} from './nightstandRecipe.ts';
import {LOUNGE_RECIPE,loungeLimits,loungeStandard,loungeErrors,lockLoungeConfiguration,loungeLegCount} from './loungeRecipe.ts';
export function furnitureDesign(id?:string){
 if(id==='solace-lounge-chair')return {id:'solace-lounge-chair' as const,recipe:LOUNGE_RECIPE,limits:loungeLimits,standard:loungeStandard,errors:loungeErrors,lock:lockLoungeConfiguration,legs:loungeLegCount,threshold:1200,modelName:'Solace Lounge Chair',supportNote:'Length expands the seat and frame. At 1500 mm, two cushion sets are added. Above 1200 / 1800 mm, supports increase to 6 / 8 legs. Armrests retain their size; height changes only the legs.'};
 return {id:'nook-nightstand' as const,recipe:NIGHTSTAND_RECIPE,limits:dimensionLimits,standard:standardDimensions,errors:dimensionErrors,lock:lockConfiguration,legs:(d:Dimensions)=>supportLegCount(d),threshold:600,modelName:'Nook Nightstand',supportNote:'Above 600 mm wide, two centre legs are added automatically. Panels and drawer parts rebuild to fit.'};
}
export const hasFurnitureDesign=(id?:string)=>id==='nook-nightstand'||id==='solace-lounge-chair';
export const configurationStorageKey=(id:string)=>id==='nook-nightstand'?'atelier-nook-configuration':`atelier-${id}-configuration`;
