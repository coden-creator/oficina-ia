export const BRANDS=Object.freeze([{id:'glowfy',name:'Glowfy'},{id:'velforce',name:'Velforce'},{id:'quiba',name:'QUIBA'},{id:'purify',name:'Purify'},{id:'coden',name:'CODEn'}]);
export const brandId=value=>BRANDS.some(b=>b.id===value)?value:'glowfy';

// One source of brand selection. There are no credentials or network effects here.
export function createBrandContext(initial='glowfy'){
 let current=brandId(initial),busy=false,revision=0,beforeChange=()=>true;
 const listeners=new Set();
 const snapshot=()=>({id:current,name:BRANDS.find(b=>b.id===current).name,busy,revision});
 const emit=()=>{const state=snapshot();for(const listener of listeners)listener(state);};
 return Object.freeze({
  get:snapshot,
  select(next){
   if(!BRANDS.some(b=>b.id===next))return false;
   if(next===current)return true;
   if(busy||beforeChange(next)===false)return false;
   current=next;revision++;emit();return true;
  },
  beforeChange(guard){beforeChange=guard;},
  setBusy(value){if(busy===Boolean(value))return;busy=Boolean(value);emit();},
  subscribe(listener){listeners.add(listener);listener(snapshot());return()=>listeners.delete(listener);}
 });
}
