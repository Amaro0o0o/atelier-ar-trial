import type {FurnitureConfiguration} from '../types/product';
import {nightstandParts,validConfiguration,type NightstandPart} from './nightstandRecipe.ts';
export const WORKSHOP_PLAN_REVISION='workshop-review-1';
export interface WorkshopPart extends NightstandPart {id:string;length:number;breadth:number;thickness:number;orderQuantity:number;note:string}
export const mm=(value:number)=>Number(value.toFixed(2)).toString();
export const html=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export function manufacturingPlan(configuration:FurnitureConfiguration,units=1){
 if(!validConfiguration(configuration)||configuration.productId!=='nook-nightstand'||!Number.isSafeInteger(units)||units<1)throw new Error('A valid saved size and whole-number quantity are required.');
 const source=nightstandParts(configuration.dimensions,configuration.recipeVersion);let panel=0,leg=0;
 const parts:WorkshopPart[]=source.map(part=>{
  const {width:w,height:h,depth:d}=part.size;
  const id=part.shape==='leg'?`L${String(++leg).padStart(2,'0')}`:part.shape==='pull'?'H01':`P${String(++panel).padStart(2,'0')}`;
  let length=w,breadth=d,thickness=h;
  if(['Left side','Right side'].includes(part.name)){length=h;breadth=d;thickness=w}
  if(['Rear panel','Drawer front','Drawer back'].includes(part.name)){length=w;breadth=h;thickness=d}
  if(['Drawer left','Drawer right'].includes(part.name)){length=d;breadth=h;thickness=w}
  if(part.shape==='leg'){length=h;breadth=44;thickness=28}
  if(part.shape==='pull'){length=w;breadth=h;thickness=d}
  const note=part.shape==='leg'?'150 mm leg; Ø44 top / Ø28 foot. Mounting hardware stack is not modelled.':part.shape==='pull'?'Brass pull placeholder. Vendor recess and fixing template required.':part.name==='Drawer front'?'14 mm visual front; 12 mm fore-aft gap to drawer box must be resolved.':part.material==='interior'?'Interior finish zone; substrate and grain direction require approval.':'Exterior finish zone; substrate, grain and edge treatment require approval.';
  return {...part,id,length,breadth,thickness,orderQuantity:units*part.quantity,note};
 });
 const find=(name:string)=>parts.find(part=>part.name===name)!;
 const d=configuration.dimensions,front=find('Drawer front'),side=find('Drawer left'),shelf=find('Support shelf');
 const drawerFrontGap=front.centre.z-front.size.depth/2-(side.centre.z+side.size.depth/2);
 const innerWidth=d.width-36,drawerWidth=find('Drawer base').size.width;
 const legs=parts.filter(part=>part.shape==='leg').map(part=>({id:part.id,fromLeft:part.centre.x+d.width/2,fromFront:d.depth/2-part.centre.z,length:part.size.height}));
 const connections=[
  {id:'J01',parts:'P01 ↔ P02 / P03',where:`Top underside and side upper edges meet at Y=${mm(d.height-18)} mm.`,method:'Butt-contact interface. Maker to specify dowels/cabinet connectors, fixing count and drill jig.'},
  {id:'J02',parts:'P04 ↔ P02 / P03',where:`Bottom sits between the side panels; underside Y=150, upper face Y=168 mm. Clear span ${mm(innerWidth)} mm.`,method:'Approve an edge-joint / cabinet-connector detail. No screw diameter, length or pilot holes are issued.'},
  {id:'J03',parts:'P05 ↔ P01 / P02 / P03 / P04',where:'Rear panel fits between the sides, above the bottom and below the top; it is flush with the rear outer plane.',method:'Approve the rear-panel fixing and squaring method before manufacture.'},
  {id:'J04',parts:'P06 ↔ P02 / P03 / P05',where:`Shelf underside Y=${mm(shelf.centre.y-9)}; top Y=${mm(shelf.centre.y+9)} mm. Rear edge meets the rear panel inner face.`,method:'Approve fixed shelf supports/connector layout and all machining positions.'},
  {id:'J05',parts:`${legs.map(part=>part.id).join(' / ')} ↔ P04`,where:'Leg top plane and bottom underside meet at Y=150 mm. Axis positions are listed separately.',method:'One mounting assembly per leg; vendor plate/bolt drawing required. Plate/foot stack height must preserve overall H.'},
  {id:'J06',parts:'P08 ↔ P09 / P10 / P11',where:'Drawer sides/back stand on the drawer-base upper face. Back panel fits between drawer sides.',method:'Proposed butt-contact box. Maker must approve the joint, fastener pattern and bottom support.'},
  {id:'J07',parts:'P07 ↔ drawer box P08–P11',where:`Current visual model has a ${mm(drawerFrontGap)} mm gap to the box front. A direct mating joint is absent.`,method:'HOLD: approve a revised front connection / bracket or revise the recipe. Do not drill or assemble from this gap.'},
  {id:'J08',parts:'Drawer box ↔ carcass / H01 ↔ P07',where:`Nominal drawer side allowance ${(innerWidth-drawerWidth)/2} mm per side; pull placeholder 102 × 8 × 2 mm.`,method:'Select the runner pair and pull first. Use their approved clearance, length and fixing templates; revise the recipe if incompatible.'}
 ];
 const steps=[
  ['Release construction details','Resolve the drawer-front gap, panel substrate, joint schedule, runner model, leg mounting stack, tolerances and load/stability checks before cutting. This document is a review pack, not a production release.'],
  ['Identify and prepare parts','Mark each part with its P/L/H ID. Use the finished nominal dimensions in the schedule. Raw blank sizes, cutting allowance, edge-band deductions, grain direction and finish allowance must come from the approved shop process.'],
  ['Dry-fit the carcass','Place P04 between P02 and P03, then locate P01 on their upper edges (J01/J02). Check the inner width and squareness. Execute only an approved connector/joint detail.'],
  ['Square the back and locate the shelf','Fit P05 within the rear opening (J03), check carcass diagonals, and locate P06 at its listed height with its rear edge against P05 (J04). Use the approved attachment layout.'],
  ['Fit the leg assemblies','Use the leg-axis reference drawing for L parts (J05). Apply the selected mounting hardware drawing, account for its stack height, then confirm overall height and all-foot contact. Reference crosses are not drill holes.'],
  ['Build and fit the drawer','Dry-fit P09/P10/P11 on P08 (J06). Select a runner pair compatible with the recorded clearances; follow its vendor mounting template. Resolve J07 before attaching P07. No runner or front fixing holes are specified here.'],
  ['Fit the front and pull after approval','Check the 3 mm nominal front reveal on each side and at the top/bottom. Attach the approved P07 front connection, then H01 using its approved template. The pull placeholder is not a machining instruction.'],
  ['Finish and verify','Apply the approved edge/finish process, measure the assembled W/D/H, check drawer travel and interference, verify all connections and floor contact, and complete the maker-approved load/stability tests. Record approval before releasing a manufactured unit.']
 ];
 return {revision:WORKSHOP_PLAN_REVISION,configuration,units,parts,legs,connections,steps,drawerFrontGap,innerWidth,drawerWidth,drawerSideAllowance:(innerWidth-drawerWidth)/2,shelfTop:shelf.centre.y+9};
}
export function manufacturingPartsCSV(configuration:FurnitureConfiguration,units=1){
 const plan=manufacturingPlan(configuration,units),quote=(value:unknown)=>`"${String(value).replace(/"/g,'""')}"`;
 return [['Part ID','Part','Qty per unit','Qty for order','Length mm','Breadth mm','Thickness mm / foot diameter','Type','Note'],...plan.parts.map(part=>[part.id,part.name,part.quantity,part.orderQuantity,mm(part.length),mm(part.breadth),mm(part.thickness),part.shape,part.note])].map(row=>row.map(quote).join(',')).join('\r\n');
}
