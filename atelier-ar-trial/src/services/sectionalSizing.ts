import type {Mesh, Object3D} from 'three';
import type {Dimensions} from '../types/product';

export type SectionalLayout = Dimensions & {chaiseSide?: 'left'|'right'};
export function isMirrored(layout: SectionalLayout) { return layout.chaiseSide === 'right'; }
export const sectionalStandard: Dimensions = {width:2930, depth:1852, height:898};
// Pitch from the model's straight footprint (1075 mm) to the original chaise.
export const chaiseModuleMM = 777;
const longArms = new WeakMap<Mesh, Mesh['geometry']>();
export const seatWidthMM = 800;
export const sectionalLimits = {width:[sectionalStandard.width-seatWidthMM/2, sectionalStandard.width+3*seatWidthMM], depth:[sectionalStandard.depth-chaiseModuleMM,sectionalStandard.depth+2*chaiseModuleMM], height:[898,970]} as const;
export function extraSeatBays(width: number) {
  return Math.max(0, Math.ceil((width-sectionalStandard.width)/seatWidthMM));
}
const duplicates = new Set(['4 L.024','Cube.001','4 L.021','4 L.003','4 L.004']);

// The imported meshes have baked coordinates in metres. Keep using those original
// bounds so changing a slider and returning to 1Ã— restores the exact geometry.
export function resizeSectional(root: Object3D, dimensions: SectionalLayout) {
  const originals: Mesh[] = [];
  const copies: Mesh[] = [];
  root.traverse(node => {
    const mesh = node as Mesh;
    if (mesh.isMesh) (mesh.userData.sectionalCopy ? copies : originals).push(mesh);
  });
  for (const copy of copies) copy.removeFromParent();
  const extra = extraSeatBays(dimensions.width);
  const pitch = seatWidthMM/1000;
  const widthChange = (dimensions.width-sectionalStandard.width)/1000;
  const depthSteps = Math.round((dimensions.depth-sectionalStandard.depth)/chaiseModuleMM);
  root.scale.x = dimensions.chaiseSide === 'right' ? -1 : 1;
  const shortArm = originals.find(mesh=>mesh.userData.name==='4 L.009');
  const longArm = originals.find(mesh=>mesh.userData.name==='4 L.015');
  if (shortArm && longArm) {
    if (!longArms.has(longArm)) longArms.set(longArm,longArm.geometry);
    longArm.geometry = depthSteps < 0 ? shortArm.geometry : longArms.get(longArm)!;
  }
  const lift = (dimensions.height-sectionalStandard.height)/1000;
  // Only the two straight bays and their inserts absorb fractional steps.
  const join = -.405;
  const straightRun = 1.605;
  const ratio = (straightRun+widthChange)/(straightRun+extra*pitch);
  for (const mesh of originals) {
    const name = mesh.userData.name as string;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox!;
    const cx = (bounds.min.x+bounds.max.x)/2;

    const foot = bounds.min.y < .001 && bounds.max.y < .06;
    const arm = name === '4 L.009' || name === '4 L.015';
    const pillow = ['4 L.001','4 L.010','4 L.018','4 L.019','4 L.020','4 L.021'].includes(name);
    const centerBay = duplicates.has(name);
    const place = (part: Mesh, shift: number) => {
      const inStraightRun = centerBay || cx > join;
      const xRatio = inStraightRun && !arm ? ratio : 1;
      const targetX = arm ? cx + Math.sign(cx)*widthChange/2 :
        join + (cx + shift - join)*xRatio - widthChange/2;
      part.scale.set(foot || pillow ? 1 : xRatio, foot ? 1+lift/bounds.max.y : 1, 1);
      part.position.set(targetX-cx*part.scale.x, foot ? 0 : lift, 0);
      part.visible = true;
      if (depthSteps < 0 && name === '4 L.015') {
        part.scale.x = -1;
        part.position.x = -widthChange/2;
      }
      if (depthSteps < 0 && ['4 L.022','4 L.010','4 L.007','4 L.008'].includes(name)) {
        part.visible = false;
        part.position.z = -chaiseModuleMM/1000;
      }
    };
    place(mesh, !centerBay && cx > 0 ? extra*pitch : 0);
    if (['4 L.022','4 L.007','4 L.008'].includes(name)) {
      for (let i=1; i<=depthSteps; i++) {
        const copy = mesh.clone();
        copy.userData.sectionalCopy = true;
        const pitchZ = chaiseModuleMM/1000;
        copy.position.z += i*pitchZ;
        if (name === '4 L.022') {
          // Bridge from the preceding cushion to the front of this module.
          const start = i===1 ? bounds.max.z : .926+(i-1)*pitchZ;
          const end = .926+i*pitchZ;
          copy.scale.z = (end-start)/(bounds.max.z-bounds.min.z);
          copy.position.z = start-bounds.min.z*copy.scale.z;
        }
        mesh.parent!.add(copy);
      }
    }
    for (let i=1; centerBay && i<=extra; i++) {
      const copy = mesh.clone();
      copy.userData.sectionalCopy = true;
      mesh.parent!.add(copy);
      place(copy,i*pitch);
    }
  }
  root.updateMatrixWorld(true);
}
