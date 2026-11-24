import {Group,Mesh,MeshStandardMaterial,MeshPhysicalMaterial,CylinderGeometry,Box3,Vector3,TubeGeometry,CatmullRomCurve3} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {loungeParts,loungeFinishes,LOUNGE_RECIPE} from './loungeRecipe.ts';
import type {Dimensions} from '../types/product';
export function createLoungeScene(dimensions:Dimensions,finish='Natural'){
 const colour=loungeFinishes.find(option=>option.name===finish)?.hex||loungeFinishes[0].hex;
 const root=new Group();root.name='Solace_lounge_parametric_concept';root.userData={recipeVersion:LOUNGE_RECIPE,dimensionsMM:{...dimensions},manufacturingStatus:'draft-needs-manufacturer-review'};
 const fabric=new MeshPhysicalMaterial({name:'Fabric_Main',color:colour,roughness:.93,sheen:.65,sheenRoughness:.8,sheenColor:colour});
 const timber=new MeshStandardMaterial({name:'Frame_Timber',color:'#79583b',roughness:.52});
 const seam=new MeshStandardMaterial({name:'Fabric_Piping',color:colour,roughness:.95});
 for(const part of loungeParts(dimensions)){
  const {width:w,height:h,depth:d}=part.size;const geometry=part.kind==='leg'?new CylinderGeometry(.0275,.0175,h/1000,32):new RoundedBoxGeometry(w/1000,h/1000,d/1000,part.kind==='upholstery'?6:2,Math.min(part.radius,w/2,h/2,d/2)/1000);
  const mesh=new Mesh(geometry,part.material==='fabric'?fabric:timber);mesh.name=`${part.id}_${part.name}`;mesh.position.set(part.centre.x/1000,part.centre.y/1000,part.centre.z/1000);mesh.rotation.x=part.rotationX;mesh.userData={partId:part.id,dimensionsMM:part.size};root.add(mesh);root.updateMatrixWorld(true);
  // Outer H is the real rounded surface, rather than an inflated rotated box.
  if(part.id==='U04'){const box=new Box3().setFromObject(mesh,true);mesh.position.y+=dimensions.height/1000-box.max.y;mesh.position.z+=-dimensions.depth/2000-box.min.z;root.updateMatrixWorld(true)}
  const seatCushion=part.name.startsWith('Seat cushion');
  if(seatCushion||part.name.startsWith('Back cushion')){
   const halfW=w/2000-0.025,halfH=(seatCushion?d:h)/2000-0.025,r=.035,points:Vector3[]=[];
   for(let corner=0;corner<4;corner++)for(let step=0;step<=8;step++){const angle=corner*Math.PI/2+step*Math.PI/16;const x=(corner===0||corner===3?1:-1)*(halfW-r),y=(corner<2?1:-1)*(halfH-r);points.push(new Vector3(x+r*Math.cos(angle),y+r*Math.sin(angle),0))}
   const piping=new Mesh(new TubeGeometry(new CatmullRomCurve3(points,true),96,.0018,6,true),seam);piping.name=`${part.id}_decorative_piping`;
   if(seatCushion){piping.rotation.x=-Math.PI/2;piping.position.set(part.centre.x/1000,(part.centre.y+h/2-10)/1000,part.centre.z/1000)}else{piping.rotation.x=part.rotationX;piping.position.set(part.centre.x/1000,(part.centre.y-Math.sin(part.rotationX)*(d/2-12))/1000,(part.centre.z+Math.cos(part.rotationX)*(d/2-12))/1000)}root.add(piping);
  }
 }
 root.updateMatrixWorld(true);return root;
}
export async function loungeGLB(dimensions:Dimensions,finish='Natural'):Promise<ArrayBuffer>{const root=createLoungeScene(dimensions,finish);try{const bounds=new Box3().setFromObject(root,true),size=bounds.getSize(new Vector3());if(Math.abs(size.x-dimensions.width/1000)>.00003||Math.abs(size.y-dimensions.height/1000)>.00003||Math.abs(size.z-dimensions.depth/1000)>.00003||Math.abs(bounds.min.y)>.00003)throw new Error('Chair dimensions failed validation');return await new GLTFExporter().parseAsync(root,{binary:true}) as ArrayBuffer}finally{const materials=new Set<MeshStandardMaterial>();root.traverse(object=>{if(object instanceof Mesh){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material as MeshStandardMaterial))}});materials.forEach(material=>material.dispose())}}
