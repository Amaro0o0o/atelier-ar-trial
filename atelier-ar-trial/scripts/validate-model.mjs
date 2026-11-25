import fs from 'node:fs';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3,Texture} from 'three';
const data=fs.readFileSync('public/models/nook-nightstand.glb');
// Inspect the embedded JPEG directly so geometry validation can run in Node.
const loader = new GLTFLoader().register(parser => ({
  name: 'validate_embedded_oak',
  async loadTexture(index) {
    const image = parser.json.images[parser.json.textures[index].source];
    assert.equal(image.mimeType, 'image/jpeg');
    const bytes = Buffer.from(await parser.getDependency('bufferView', image.bufferView));
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
    assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9);
    return new Texture();
  }
}));
const gltf=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
const bounds=new Box3().setFromObject(gltf.scene),size=bounds.getSize(new Vector3());
assert(Math.abs(size.x-.5)<.0001);assert(Math.abs(size.y-.55)<.0001);assert(Math.abs(size.z-.4)<.0001);assert(Math.abs(bounds.min.y)<.0001);
let meshes=0,triangles=0;const materials=new Set();gltf.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m.name)}});
assert(materials.has('Finish_Wood'));assert(materials.has('Hardware_Brushed_Brass'));
console.log(JSON.stringify({sizeMetres:size.toArray(),floorY:bounds.min.y,meshes,triangles,materials:[...materials],bytes:data.length},null,2));
