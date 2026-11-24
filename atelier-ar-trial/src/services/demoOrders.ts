import type {Product,FurnitureConfiguration} from '../types/product';
import {validConfiguration} from './nightstandRecipe.ts';
import {draftPacketHTML} from './manufacturingPacket.ts';

export interface DemoOrderReview {
 checkoutId:string;productId:string;productName:string;manufacturer:string;
 configuration:FurnitureConfiguration;quantity:number;stockLimit:number;
 demoUnitPrice:number;currency:'INR';createdAt:string;
}
export interface DemoOrder extends DemoOrderReview {
 id:string;prototype:true;status:'demo-confirmed';payment:'simulated';
 manufacturerDelivery:'simulated';demoTotal:number;confirmedAt:string;
}
const copy=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const validQuantity=(quantity:number,stock:number)=>Number.isInteger(quantity)&&quantity>=1&&Number.isInteger(stock)&&quantity<=stock;
function validateReview(review:DemoOrderReview){
 if(!review||typeof review.checkoutId!=='string'||!review.checkoutId||!validConfiguration(review.configuration)||review.productId!==review.configuration.productId||!validQuantity(review.quantity,review.stockLimit)||!Number.isFinite(review.demoUnitPrice)||review.demoUnitPrice<0||!Number.isFinite(review.demoUnitPrice*review.quantity)||review.currency!=='INR'||typeof review.productName!=='string'||typeof review.manufacturer!=='string'||!Number.isFinite(Date.parse(review.createdAt)))throw new Error('This demo order is invalid. Lock the size again and retry.');
}
export function createDemoOrderReview(product:Product,configuration:FurnitureConfiguration,quantity=1):DemoOrderReview {
 if(!validConfiguration(configuration)||product.id!==configuration.productId||!product.colours.some(colour=>colour.name===configuration.finish))throw new Error('Save the current size and finish before ordering.');
 const review:DemoOrderReview={checkoutId:crypto.randomUUID(),productId:product.id,productName:product.name,manufacturer:product.manufacturer.name,configuration:copy(configuration),quantity,stockLimit:product.stock,demoUnitPrice:product.price,currency:'INR',createdAt:new Date().toISOString()};
 validateReview(review);return review;
}
export function completeDemoOrder(review:DemoOrderReview,orders:DemoOrder[]=[]){
 validateReview(review);
 const existing=orders.find(order=>order.checkoutId===review.checkoutId);
 if(existing)return {order:copy(existing),orders:copy(orders)};
 const order:DemoOrder={...copy(review),id:`DEMO-${crypto.randomUUID().slice(0,8).toUpperCase()}`,prototype:true,status:'demo-confirmed',payment:'simulated',manufacturerDelivery:'simulated',demoTotal:review.quantity*review.demoUnitPrice,confirmedAt:new Date().toISOString()};
 return {order,orders:[order,...copy(orders)].slice(0,100)};
}
function validOrder(value:unknown):value is DemoOrder {
 try{const order=value as DemoOrder;validateReview(order);return order.prototype===true&&order.status==='demo-confirmed'&&order.payment==='simulated'&&order.manufacturerDelivery==='simulated'&&typeof order.id==='string'&&order.id.startsWith('DEMO-')&&order.demoTotal===order.quantity*order.demoUnitPrice&&Number.isFinite(Date.parse(order.confirmedAt))}catch{return false}
}
type OrderStorage=Pick<Storage,'getItem'|'setItem'>;
const storageKey='atelier-demo-orders';
const browserStorage=()=>{try{return typeof window==='undefined'?undefined:window.localStorage}catch{return undefined}};
export function readDemoOrders(storage:OrderStorage|undefined=browserStorage()):DemoOrder[]{
 try{const values=JSON.parse(storage?.getItem(storageKey)||'[]');return Array.isArray(values)?values.filter(validOrder).slice(0,100):[]}catch{return []}
}
export function saveDemoOrders(reviews:DemoOrderReview[],storage:OrderStorage|undefined=browserStorage()){
 if(!reviews.length)return [];
 if(!storage)throw new Error('Browser storage is unavailable. Allow local storage to save this demo order.');
 const unique=Array.from(new Map(reviews.map(review=>[review.checkoutId,review])).values());
 const quantities=new Map<string,{quantity:number;limit:number}>();
 for(const review of unique){validateReview(review);const previous=quantities.get(review.productId);const value={quantity:(previous?.quantity||0)+review.quantity,limit:Math.min(previous?.limit??review.stockLimit,review.stockLimit)};if(value.quantity>value.limit)throw new Error('The combined quantity exceeds the demo stock for this furniture.');quantities.set(review.productId,value)}
 let records=readDemoOrders(storage);const confirmed:DemoOrder[]=[];
 for(const review of unique){const result=completeDemoOrder(review,records);demoOrderPacketHTML(result.order);records=result.orders;confirmed.push(result.order)}
 // One write: a failed line or packet must not leave a partially-confirmed bag.
 try{storage.setItem(storageKey,JSON.stringify(records))}catch{throw new Error('The demo order could not be saved in this browser. Free some storage and try again.')}
 return confirmed;
}
export function saveDemoOrder(review:DemoOrderReview,storage:OrderStorage|undefined=browserStorage()){return saveDemoOrders([review],storage)[0]}

const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export function demoOrderPacketHTML(order:DemoOrder){
 if(!validOrder(order))throw new Error('Invalid demo order record');
 const summary=`<section style="border:2px solid #526744;padding:18px;margin-bottom:24px"><h2>PROTOTYPE ORDER — ${escape(order.id)}</h2><p><strong>Payment: SIMULATED · Manufacturer delivery: SIMULATED</strong><br>No money was charged and nothing was sent to the manufacturer.</p><p>${escape(order.productName)} · Quantity: ${order.quantity}<br>Manufacturer: ${escape(order.manufacturer)}<br>Demo total: INR ${order.demoTotal} (catalogue price for demonstration only)</p><p>This packet uses the order's saved configuration. The component schedule shows quantities per furniture unit and for this complete order of ${order.quantity} unit(s).</p></section>`;
 return draftPacketHTML(order.configuration,order.quantity).replace('<body>','<body>'+summary).replace('</body>',`<h2>Prototype order record</h2><pre>${escape(JSON.stringify(order,null,2))}</pre></body>`);
}
export function downloadDemoOrderPacket(order:DemoOrder){const url=URL.createObjectURL(new Blob([demoOrderPacketHTML(order)],{type:'text/html;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`${order.id.toLowerCase()}-blueprint.html`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
