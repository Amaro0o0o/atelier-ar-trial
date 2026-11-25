import {useEffect,useRef,useState} from 'react';
import type {Dimensions} from '../types/product';
export function useConfiguredModel(enabled:boolean,dimensions:Dimensions,fallback:string|null,finish='Natural',productId='nook-nightstand'){
 const [state,setState]=useState<{url:string|null;busy:boolean;error:string}>({url:fallback,busy:enabled,error:''});const previous=useRef<string|null>(null);
 useEffect(()=>{if(!enabled){setState({url:fallback,busy:false,error:''});return}let active=true;setState(s=>({...s,busy:true,error:''}));
 (productId==='solace-lounge-chair'?import('../services/loungeModel').then(m=>m.loungeGLB(dimensions,finish)):import('../services/nightstandModel').then(m=>m.texturedNightstandGLB(dimensions,finish))).then(data=>{if(!active)return;const next=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const old=previous.current;previous.current=next;setState({url:next,busy:false,error:''});if(old)setTimeout(()=>URL.revokeObjectURL(old),10000)}).catch(error=>{if(active)setState(s=>({...s,busy:false,error:error instanceof Error?error.message:'Could not rebuild this model'}))});return()=>{active=false};
 },[enabled,dimensions.width,dimensions.height,dimensions.depth,fallback,finish,productId]);
 useEffect(()=>()=>{if(previous.current)URL.revokeObjectURL(previous.current)},[]);return state;
}
