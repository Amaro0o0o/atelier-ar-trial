import { products } from '../data/products';
export const productService={list:async()=>products,get:async(id:string)=>products.find(p=>p.id===id)};
export const money=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
export const millimetresToMetres=(value:number)=>value/1000;
