import {Group,Mesh,MeshStandardMaterial,CylinderGeometry,Box3,Vector3,RepeatWrapping,SRGBColorSpace,Texture,TextureLoader} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {nightstandParts,NIGHTSTAND_RECIPE} from './nightstandRecipe.ts';
import {oakTint} from './oakFinish.ts';
import type {Dimensions} from '../types/product';
export function createNightstandScene(dimensions:Dimensions,finish='Natural', grain?:Texture){
 const root=new Group();root.name='Nook_parametric_concept';root.userData={recipeVersion:NIGHTSTAND_RECIPE,dimensionsMM:{...dimensions},manufacturingStatus:'draft-needs-manufacturer-review'};
 const materials={wood:new MeshStandardMaterial({name:'Finish_Wood',map:grain ?? null,color:grain?oakTint(finish):finish==='Walnut'?'#705039':finish==='Charcoal'?'#424744':'#bc9164',roughness:.48}),interior:new MeshStandardMaterial({name:'Interior_Wood',map:grain ?? null,color:grain?'#c8af96':'#735038',roughness:.62}),brass:new MeshStandardMaterial({name:'Hardware_Brushed_Brass',color:'#a58b4b',metalness:.8,roughness:.3})};
 for(const part of nightstandParts(dimensions)){const {width,height,depth}=part.size;const geometry=part.shape==='leg'?new CylinderGeometry(.022,.014,height/1000,24):new RoundedBoxGeometry(width/1000,height/1000,depth/1000,2,Math.min(.003,height/4000,depth/4000));if (part.material !== 'brass') {
   const {position, normal, uv} = geometry.attributes;
   const upright = width < height || part.shape === 'leg';
   const offset = root.children.length * .137;
   for (let i = 0; i < uv.count; i++) {
     const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
     const nx = Math.abs(normal.getX(i)), ny = Math.abs(normal.getY(i)), nz = Math.abs(normal.getZ(i));
     const top = ny > nx && ny > nz;
     const side = nx > nz;
     const u = top ? x : upright ? y : side ? z : x;
     const v = top ? z : upright ? (side ? z : x) : y;
     uv.setXY(i, u / .65 + .5 + offset, v / .65 + .5 + offset);
   }
 }const mesh=new Mesh(geometry,materials[part.material]);mesh.name=part.name;mesh.position.set(part.centre.x/1000,part.centre.y/1000,part.centre.z/1000);mesh.userData={dimensionsMM:part.size};root.add(mesh)}root.updateMatrixWorld(true);return root;
}
export async function configuredGLB(dimensions:Dimensions,finish='Natural', grain?:Texture):Promise<ArrayBuffer>{const root=createNightstandScene(dimensions,finish,grain);try{const box=new Box3().setFromObject(root),size=box.getSize(new Vector3());if(Math.abs(size.x-dimensions.width/1000)>.00001||Math.abs(size.y-dimensions.height/1000)>.00001||Math.abs(size.z-dimensions.depth/1000)>.00001)throw new Error('Model dimensions failed validation');return await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true}) as ArrayBuffer}finally{const materials=new Set<MeshStandardMaterial>();root.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m as MeshStandardMaterial))}});materials.forEach(m=>m.dispose())}}

let oakTexture: Promise<Texture> | undefined;
export async function texturedNightstandGLB(dimensions: Dimensions, finish: string) {
  oakTexture ??= new TextureLoader().loadAsync(new URL('../assets/nook-oak.jpg', import.meta.url).href)
    .then(texture => {
      texture.colorSpace = SRGBColorSpace;
      texture.userData.mimeType = 'image/jpeg';
      texture.wrapS = texture.wrapT = RepeatWrapping;
      return texture;
    }).catch(error => {
      oakTexture = undefined;
      throw error;
    });
  return configuredGLB(dimensions, finish, await oakTexture);
}

