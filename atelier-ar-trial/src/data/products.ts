import type { Product } from '../types/product';
export const categories=['Sofas','Chairs','Tables','Beds','Wardrobes','Cabinets','Storage','Office Furniture'];
const photos={sofa:'photo-1555041469-a586c61ea9bc',chair:'photo-1567538096630-e0c55bd6374c',table:'photo-1533090161767-e6ffed986c88',bed:'photo-1505693416388-ac5ce068fe85',room:'photo-1600210492486-724fe5c67fb0',office:'photo-1497366754035-f200968a6e72',storage:'photo-1595428774223-ef52624120d2'};
export const image=(key:keyof typeof photos,w=1000)=>`https://images.unsplash.com/${photos[key]}?auto=format&fit=crop&w=${w}&q=85`;
const rows:[string,string,number,keyof typeof photos,string,string][]=[['Sora Linen Sofa','Sofas',54900,'sofa','Linen','Quiet Living'],['Forma Lounge Chair','Chairs',18900,'chair','Oak','Natural Forms'],['Arc Coffee Table','Tables',22900,'table','Oak','Natural Forms'],['Haven Upholstered Bed','Beds',64900,'bed','Linen','Quiet Living'],['Oslo Modular Sofa','Sofas',78900,'sofa','Bouclé','Quiet Living'],['Noma Dining Chair','Chairs',12900,'chair','Oak','Everyday Rituals'],['Gather Dining Table','Tables',42900,'table','Walnut','Everyday Rituals'],['Dawn Platform Bed','Beds',48900,'bed','Oak','Natural Forms'],['Linea Wardrobe','Wardrobes',68900,'storage','Engineered Wood','Quiet Living'],['Reed Sideboard','Cabinets',34900,'storage','Walnut','Natural Forms'],['Frame Bookshelf','Storage',24900,'storage','Oak','Everyday Rituals'],['Studio Writing Desk','Office Furniture',27900,'office','Oak','Work in Balance'],['Cloud Two-Seater','Sofas',45900,'sofa','Linen','Quiet Living'],['Terra Accent Chair','Chairs',21900,'chair','Bouclé','Natural Forms'],['Pebble Side Table','Tables',8900,'table','Oak','Natural Forms'],['Rest King Bed','Beds',72900,'bed','Walnut','Quiet Living'],['Cove Sliding Wardrobe','Wardrobes',82900,'storage','Engineered Wood','Quiet Living'],['Milo Media Cabinet','Cabinets',29900,'storage','Oak','Everyday Rituals'],['Nest Storage Unit','Storage',16900,'storage','Engineered Wood','Everyday Rituals'],['Balance Office Chair','Office Furniture',15900,'chair','Fabric','Work in Balance'],['Sunday Corner Sofa','Sofas',94900,'sofa','Linen','Quiet Living'],['Ritual Bench','Chairs',19900,'chair','Walnut','Everyday Rituals'],['Column Console','Tables',25900,'table','Walnut','Natural Forms'],['Focus Workstation','Office Furniture',38900,'office','Oak','Work in Balance']];
export const products:Product[]=rows.map(([name,category,price,photo,material,collection],i)=>{const dimensions={width:category==='Sofas'?2100:category==='Beds'?1800:1200,height:category==='Wardrobes'?2000:category==='Tables'?450:800,depth:category==='Beds'?2100:600};const customizable=[0,6,8,11,16,23].includes(i);return {id:`f-${i+1}`,name,category,type:category==='Sofas'?'Seating':category==='Beds'?'Bedroom':category==='Tables'?'Surface':category==='Office Furniture'?'Workspace':'Essentials',description:`A considered piece for everyday living. The ${name} pairs clean lines with tactile ${material.toLowerCase()} and a beautifully balanced silhouette. Crafted in India with carefully selected materials and enduring details.`,price,currency:'INR',images:[image(photo),image(photo,1600),image(photo,700)],materials:[material],colours:[{name:'Natural',hex:'#c8b79d'},{name:'Walnut',hex:'#72513d'},{name:'Charcoal',hex:'#44443e'}],dimensions,minDimensions:customizable?{width:800,height:400,depth:400}:null,maxDimensions:customizable?{width:2600,height:2400,depth:2200}:null,customizable,customizableParameters:customizable?['width']:[],modelUrl:null,arCompatible:false,availability:i===18?'Out of stock':i%5===0?'Made to order':'In stock',stock:i===18?0:12,manufacturer:{name:'Atelier Design Studio',country:'India'},collection,createdAt:`2026-10-${String(i+1).padStart(2,'0')}`,finish:material==='Walnut'?'Oiled walnut':'Natural matte'};});

// Colour-specific product photography; unsupported products retain their existing photos.
export const sofaColours = [
  {name:'Natural',hex:'#c7b89e',images:['./images/sofa-natural.png']},
  {name:'Forest',hex:'#254f48',images:['./images/sofa-original.jpg']},
  {name:'Charcoal',hex:'#414345',images:['./images/sofa-charcoal.png']},
];
products.filter(p=>p.category==='Sofas').forEach(p=>{
  p.colours=sofaColours;
  p.images=sofaColours[0].images;
});
export function productImages(product:Product,colour:string){
  const variant=product.colours.find(c=>c.name===colour)?.images;
  return product.id==='solace-lounge-chair'&&variant?variant:product.modelUrl&&variant?[variant[0],...product.images.slice(1)]:variant || product.images;
}

products.push({
 id:'nook-nightstand',name:'Nook Oak Nightstand',category:'Tables',type:'Bedside table',
 description:'A compact bedside companion with softened edges, a single drawer, an open shelf and four tapered legs. An original Atelier concept with an understated brass pull. Explore the actual 3D model below and switch between three finishes.',
 price:12900,currency:'INR',images:['./images/nightstand-natural.png','./images/nightstand-side.png','./images/nightstand-rear.png'],
 materials:['Oak'],colours:[
 {name:'Natural',hex:'#bc9164',images:['./images/nightstand-natural.png']},
 {name:'Walnut',hex:'#705039',images:['./images/nightstand-walnut.png']},
 {name:'Charcoal',hex:'#424744',images:['./images/nightstand-charcoal.png']}],
 dimensions:{width:500,height:550,depth:400},minDimensions:{width:400,height:450,depth:300},maxDimensions:{width:700,height:750,depth:550},
 customizable:true,customizableParameters:['width','height','depth'],modelUrl:'./models/nook-nightstand.glb',arCompatible:true,
 availability:'Made to order',stock:10,manufacturer:{name:'Atelier Design Studio',country:'India'},
 collection:'Quiet Living',createdAt:'2026-11-16',finish:'Matte wood finish'
});


products.push({
 id:'solace-lounge-chair',name:'Solace Lounge Chair',category:'Chairs',type:'Relaxing lounge chair',
 description:'A deep, softly upholstered lounge chair with rounded arms, a gently reclined back, plump cushions and a warm timber frame. An original Atelier prototype, modelled as separate frame, leg and upholstery components. Choose Natural, Forest or Charcoal. Extend the seat from a single lounge chair to a two-seater, adjust the seat depth, or change only the leg height. The armrests keep their size.',
 price:32900,currency:'INR',images:['./images/solace-natural.webp','./images/solace-side.webp','./images/solace-rear.webp'],
 materials:['Upholstery','Timber frame'],colours:[{name:'Natural',hex:'#c1b195',images:['./images/solace-natural.webp','./images/solace-side.webp','./images/solace-rear.webp']},{name:'Forest',hex:'#36594d',images:['./images/solace-forest.webp','./images/solace-forest-side.webp','./images/solace-forest-rear.webp']},{name:'Charcoal',hex:'#454b50',images:['./images/solace-charcoal.webp','./images/solace-charcoal-side.webp','./images/solace-charcoal-rear.webp']}],
 dimensions:{width:880,height:780,depth:840},minDimensions:{width:880,height:748,depth:756},maxDimensions:{width:2024,height:928,depth:1008},
 customizable:true,customizableParameters:['width','height','depth'],modelUrl:'./models/solace-lounge-chair.glb',arCompatible:true,
 availability:'Made to order',stock:8,manufacturer:{name:'Atelier Design Studio',country:'India'},collection:'Quiet Living',createdAt:'2026-11-24',finish:'Soft upholstery · natural timber frame'
});
