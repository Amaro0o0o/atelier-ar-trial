import {html,mm,type WorkshopPart} from './manufacturingPlan.ts';
type Point={x:number;y:number;z:number};
const palette={wood:'#d9c49c',interior:'#c1b6a2',brass:'#b99b52'};
const polygon=(points:number[][],fill:string)=>`<polygon points="${points.map(point=>point.map(mm).join(',')).join(' ')}" fill="${fill}" stroke="#45504b" stroke-width="1.15"/>`;
export function explodedAssemblySVG(parts:WorkshopPart[]){
 const items=parts.map(part=>{
  let {x,y,z}=part.centre;
  if(part.name==='Top')y+=150;
  if(part.name==='Left side')x-=100;
  if(part.name==='Right side')x+=100;
  if(part.name==='Bottom')y-=25;
  if(part.name==='Rear panel')z-=130;
  if(part.name==='Support shelf')y+=55;
  if(part.name.startsWith('Drawer')){z+=200;if(part.name==='Drawer front')z+=130;if(part.name==='Drawer base')y-=170;if(part.name==='Drawer left')x-=55;if(part.name==='Drawer right')x+=55;if(part.name==='Drawer back')z-=90}
  if(part.shape==='leg'){y-=100;x+=Math.sign(x)*30;z+=Math.sign(z)*30}
  if(part.shape==='pull')z+=400;
  const {width:w,height:h,depth:d}=part.size;
  const vertices:Point[]=[];
  for(const yy of [-1,1])for(const zz of [-1,1])for(const xx of [-1,1]){const radius=part.shape==='leg'?(yy<0?part.thickness/2:part.breadth/2):null;vertices.push({x:x+xx*(radius??w/2),y:y+yy*h/2,z:z+zz*(radius??d/2)})}
  return {part,centre:{x,y,z},vertices};
 });
 const project=(point:Point)=>[.85*point.x-.65*point.z,-point.y+.28*(point.x+point.z)];
 const flat=items.flatMap(item=>item.vertices.map(project));const xs=flat.map(point=>point[0]),ys=flat.map(point=>point[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(600/(maxX-minX),640/(maxY-minY));
 const screen=(point:Point)=>{const value=project(point);return [560+(value[0]-(minX+maxX)/2)*scale,390+(value[1]-(minY+maxY)/2)*scale]};
 const faces=items.sort((a,b)=>a.centre.x+a.centre.z+a.centre.y*.3-(b.centre.x+b.centre.z+b.centre.y*.3)).map(item=>{
  const v=item.vertices.map(screen),fill=palette[item.part.material];
  return `<g data-part="${item.part.id}">${polygon([v[1],v[3],v[7],v[5]],fill)}${polygon([v[2],v[3],v[7],v[6]],fill)}${polygon([v[4],v[5],v[7],v[6]],'#eee3cc')}</g>`;
 }).join('');
 const labels=items.map(item=>({...item,p:screen(item.centre)}));
 const callouts=[true,false].map(left=>{
  const side=labels.filter(item=>(item.p[0]<560)===left).sort((a,b)=>a.p[1]-b.p[1]);
  return side.map((item,index)=>{const x=left?120:1000,y=100+index*(580/Math.max(1,side.length-1));return `<path d="M${mm(item.p[0])} ${mm(item.p[1])} L${x+(left?75:-75)} ${y} H${x+(left?26:-26)}" stroke="#7a827b" fill="none" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${side.length>11?21:25}" fill="#f8faf5" stroke="#53684a"/><text x="${x}" y="${y+6}" text-anchor="middle" font-size="17">${item.part.id}</text>`}).join('');
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1120 810" role="img" aria-label="Exploded furniture assembly with individually identified panels, legs and pull"><rect width="1120" height="810" fill="#fff"/><g font-family="Arial,sans-serif" fill="#283c30"><text x="35" y="32" font-size="20" font-weight="bold">EXPLODED COMPONENT REFERENCE</text>${faces}${callouts}<text x="35" y="755" font-size="15">Match P / L / H IDs to the component schedule and connection table.</text><text x="35" y="780" font-size="14">Not to scale. Legs shown as tapered envelopes. Joint and drilling details require approval.</text></g></svg>`;
}
export function partDrawingSVG(part:WorkshopPart){
 const title=`${part.id} · ${part.name}`;
 let drawing='';
 if(part.shape==='leg'){
  drawing=`<path d="M152 47h36l-7 100h-22Z" fill="${palette.wood}" stroke="#45504b"/><path d="M130 47v100m-5-100h10m-10 100h10" stroke="#45504b"/><text x="115" y="100" transform="rotate(-90 115 100)" text-anchor="middle">${mm(part.length)} mm</text><text x="170" y="39" text-anchor="middle">Ø${mm(part.breadth)} top</text><text x="170" y="168" text-anchor="middle">Ø${mm(part.thickness)} foot</text>`;
 }else{
  const scale=Math.min(220/part.length,95/part.breadth),w=part.length*scale,h=part.breadth*scale,x=60,y=55;
  drawing=`<rect x="${x}" y="${y}" width="${mm(w)}" height="${mm(h)}" fill="${palette[part.material]}" stroke="#45504b"/><path d="M${x} ${y+h+15}h${w}m-${w} -4v8m${w} -8v8 M${x-15} ${y}v${h}" fill="none" stroke="#45504b"/><text x="${mm(x+w/2)}" y="${mm(y+h+35)}" text-anchor="middle">${mm(part.length)} mm</text><text x="25" y="${mm(y+h/2)}" transform="rotate(-90 25 ${mm(y+h/2)})" text-anchor="middle">${mm(part.breadth)} mm</text>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 225" role="img" aria-label="${html(title)} nominal part dimensions"><rect width="340" height="225" fill="#fff"/><g font-family="Arial,sans-serif" font-size="14" fill="#283c30"><text x="10" y="22" font-weight="bold">${html(title)}</text>${drawing}<text x="10" y="207">${part.shape==='leg'?'Tapered leg':`Thickness ${mm(part.thickness)} mm`} · Qty ${part.orderQuantity} for order</text></g></svg>`;
}
export function legLocationSVG(width:number,depth:number,legs:{id:string;fromLeft:number;fromFront:number}[]){
 const scale=Math.min(560/width,360/depth),w=width*scale,d=depth*scale,x=85,y=80;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 540" role="img" aria-label="Leg axis locations measured from the left and front outer edges"><rect width="760" height="540" fill="white"/><g font-family="Arial,sans-serif" font-size="15" fill="#283c30"><text x="85" y="30" font-weight="bold">LEG AXIS REFERENCE — UNDERSIDE LAYOUT</text><text x="${x+w/2}" y="60" text-anchor="middle">FRONT EDGE · origin at left/front</text><rect x="${x}" y="${y}" width="${w}" height="${d}" fill="#f5f5ee" stroke="#61705a" stroke-dasharray="5 4"/><rect x="${x+18*scale}" y="${y}" width="${w-36*scale}" height="${d}" fill="#dce4d3" stroke="#43543b"/>${legs.map(leg=>{const cx=x+leg.fromLeft*scale,cy=y+leg.fromFront*scale;return `<circle cx="${cx}" cy="${cy}" r="${22*scale}" fill="#c4d3b5" stroke="#43543b"/><path d="M${cx-8} ${cy}h16m-8-8v16" stroke="#43543b"/><text x="${cx+26*scale}" y="${cy+5}">${leg.id}</text>`}).join('')}<text x="85" y="${y+d+35}">Outer width ${mm(width)} mm · Depth ${mm(depth)} mm · P04 lies 18 mm inside each side</text><text x="85" y="${y+d+65}">Crosses locate leg axes only. They are NOT drilling or mounting-plate hole patterns.</text></g></svg>`;
}
