import type {CartLine,FurnitureConfiguration,Product} from '../types/product';
import {validConfiguration} from './nightstandRecipe.ts';
export const cartLineKey=(line:CartLine)=>`${line.productId}:${line.colour}:${line.configuration?.id||'standard'}`;
export function addCartLine(cart:CartLine[],product:Product,colour:string,quantity:number,configuration?:FurnitureConfiguration):CartLine[]{
 if(configuration&&(!validConfiguration(configuration)||configuration.productId!==product.id||configuration.finish!==colour))throw new Error('Configuration does not match this product and finish.');
 if(!product.stock||!product.colours.some(c=>c.name===colour)||!Number.isInteger(quantity)||quantity<1)return cart;
 const remaining=product.stock-cart.filter(l=>l.productId===product.id).reduce((sum,l)=>sum+l.quantity,0);if(remaining<=0)return cart;
 const line:CartLine={productId:product.id,colour,quantity:Math.min(quantity,remaining),...(configuration?{configuration:structuredClone(configuration)}:{})};
 const key=cartLineKey(line),existing=cart.find(l=>cartLineKey(l)===key);return existing?cart.map(l=>cartLineKey(l)===key?{...l,quantity:l.quantity+line.quantity}:l):[...cart,line];
}
export function updateCartLine(cart:CartLine[],product:Product,colour:string,quantity:number,configurationId?:string){if(!Number.isInteger(quantity))return cart;const key=cartLineKey({productId:product.id,colour,quantity:1,...(configurationId?{configuration:{id:configurationId} as FurnitureConfiguration}:{})});const otherQuantity=cart.filter(l=>l.productId===product.id&&cartLineKey(l)!==key).reduce((sum,l)=>sum+l.quantity,0);return cart.flatMap(l=>cartLineKey(l)===key?quantity<=0?[]:[{...l,quantity:Math.min(quantity,Math.max(0,product.stock-otherQuantity))}]:[l])}
