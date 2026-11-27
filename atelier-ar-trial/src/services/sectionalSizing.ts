import type {Mesh, Object3D} from 'three';
import type {Dimensions} from '../types/product';

export const sectionalStandard: Dimensions = {width:2930, depth:1852, height:898};
export const sectionalLimits = {width:[2500,4000], depth:[1852,2000], height:[898,970]} as const;
export const extraBayAt = 3400;
const duplicates = new Set(['4 L.024','Cube.001','4 L.021','4 L.003','4 L.004']);

// The imported meshes have baked coordinates in metres. Keep using those original
// bounds so changing a slider and returning to 1× restores the exact geometry.
export function resizeSectional(root: Object3D, dimensions: Dimensions) {
  const originals: Mesh[] = [];
  const copies: Mesh[] = [];
  root.traverse(node => {
    const mesh = node as Mesh;
    if (mesh.isMesh) (mesh.userData.sectionalCopy ? copies : originals).push(mesh);
  });
  for (const copy of copies) copy.removeFromParent();
  const extra = dimensions.width >= extraBayAt;
  const bay = extra ? .815 : 0;
  const widthChange = (dimensions.width-sectionalStandard.width)/1000;
  const depthChange = (dimensions.depth-sectionalStandard.depth)/1000;
  const lift = (dimensions.height-sectionalStandard.height)/1000;
  const interior = 2.93 - .553;
  const ratio = (interior+widthChange)/(interior+bay);
  for (const mesh of originals) {
    const name = mesh.userData.name as string;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox!;
    const cx = (bounds.min.x+bounds.max.x)/2;
    const cz = (bounds.min.z+bounds.max.z)/2;
    const foot = bounds.min.y < .001 && bounds.max.y < .06;
    const arm = name === '4 L.009' || name === '4 L.015';
    const pillow = ['4 L.001','4 L.010','4 L.018','4 L.019','4 L.020','4 L.021'].includes(name);
    const centerBay = duplicates.has(name);
    const place = (part: Mesh, shift: number) => {
      part.scale.set(arm || foot || pillow ? 1 : ratio, foot ? 1+lift/bounds.max.y : 1, 1);
      part.position.set(arm ? Math.sign(cx)*widthChange/2 : (cx+shift)*ratio - cx*part.scale.x, foot ? 0 : lift, 0);
      if (name === '4 L.022') {
        part.scale.z = 1 + depthChange/(bounds.max.z-bounds.min.z);
        part.position.z = bounds.min.z*(1-part.scale.z);
      } else if (name === '4 L.015' || cz > .25) part.position.z = depthChange;
    };
    place(mesh, (centerBay ? -1 : Math.sign(cx))*bay/2);
    if (extra && centerBay) {
      const copy = mesh.clone();
      copy.userData.sectionalCopy = true;
      mesh.parent!.add(copy);
      place(copy,bay/2);
    }
  }
  root.updateMatrixWorld(true);
}
