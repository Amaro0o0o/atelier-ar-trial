import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import type {CartLine,FurnitureConfiguration} from '../types/product';
import {products} from '../data/products';
import {addCartLine,updateCartLine} from '../services/cart';
import {validConfiguration} from '../services/nightstandRecipe';
function readArray(key:string):unknown[]{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
function useStore(){
 const [wishlist,setWishlist]=useState<string[]>(()=>readArray('atelier-wishlist').filter((id):id is string=>typeof id==='string'&&products.some(p=>p.id===id)));
 const [cart,setCart]=useState<CartLine[]>(()=>readArray('atelier-cart').filter((raw):raw is CartLine=>{if(!raw||typeof raw!=='object')return false;const l=raw as CartLine;return products.some(p=>p.id===l.productId&&p.colours.some(c=>c.name===l.colour))&&Number.isInteger(l.quantity)&&l.quantity>0&&(!l.configuration||(validConfiguration(l.configuration)&&l.configuration.finish===l.colour&&l.configuration.productId===l.productId))}));
 useEffect(()=>{try{localStorage.setItem('atelier-wishlist',JSON.stringify(wishlist))}catch{}},[wishlist]);
 useEffect(()=>{try{localStorage.setItem('atelier-cart',JSON.stringify(cart))}catch{}},[cart]);
 return {wishlist,cart,toggle:(id:string)=>setWishlist(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]),add:(productId:string,colour:string,quantity:number,configuration?:FurnitureConfiguration)=>setCart(c=>{const p=products.find(p=>p.id===productId);return p?addCartLine(c,p,colour,quantity,configuration):c}),update:(productId:string,colour:string,quantity:number,configurationId?:string)=>setCart(c=>{const p=products.find(p=>p.id===productId);return p?updateCartLine(c,p,colour,quantity,configurationId):c})};
}
const Store=createContext<ReturnType<typeof useStore>|null>(null);
export function StoreProvider({children}:{children:ReactNode}){return <Store.Provider value={useStore()}>{children}</Store.Provider>}
export function useShop(){return useContext(Store)!}
