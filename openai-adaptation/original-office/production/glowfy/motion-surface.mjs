// Deterministic textured 2.5D surfaces. Source pixels are the project's vector children.
// No network assets, executable model code, WebGL runtime or new dependencies.
import {createRequire} from 'node:module';
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
const surfaces=new WeakMap();
const rad=d=>d*Math.PI/180;
export function projectSurface(x,y,z,w,h,tiltX,tiltY){
 const a=rad(tiltX),b=rad(tiltY),xx=x-w/2,yy=y-h/2;
 const ry=yy*Math.cos(a)-z*Math.sin(a),rz=yy*Math.sin(a)+z*Math.cos(a);
 const rx=xx*Math.cos(b)+rz*Math.sin(b),zz=-xx*Math.sin(b)+rz*Math.cos(b);
 const p=2200/(2200-zz);return [rx*p,ry*p];
}
function triangle(c,img,src,dst){
 const [[x0,y0],[x1,y1],[x2,y2]]=src,[[u0,v0],[u1,v1],[u2,v2]]=dst;
 const det=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);if(Math.abs(det)<1e-8)return;
 const coefficients=q=>[(q[0]*(y1-y2)+q[1]*(y2-y0)+q[2]*(y0-y1))/det,(q[0]*(x2-x1)+q[1]*(x0-x2)+q[2]*(x1-x0))/det,(q[0]*(x1*y2-x2*y1)+q[1]*(x2*y0-x0*y2)+q[2]*(x0*y1-x1*y0))/det];
 const [a,cc,e]=coefficients([u0,u1,u2]),[b,d,f]=coefficients([v0,v1,v2]);
 c.save();c.beginPath();
 // Small overlapping clip avoids raster cracks between adjacent textured triangles.
 const mx=(u0+u1+u2)/3,my=(v0+v1+v2)/3;
 dst.forEach(([x,y],i)=>{const len=Math.hypot(x-mx,y-my)||1,xx=x+(x-mx)*.32/len,yy=y+(y-my)*.32/len;i?c.lineTo(xx,yy):c.moveTo(xx,yy);});c.closePath();c.clip();
 c.transform(a,b,cc,d,e,f);c.drawImage(img,0,0);c.restore();
}
export function drawSurface(c,node,v,drawChildren){
 const w=node.w,h=node.h;let surface=surfaces.get(node);
 if(!surface){surface=createCanvas(Math.ceil(w),Math.ceil(h));surfaces.set(node,surface);}
 const f=surface.getContext('2d');f.resetTransform();f.clearRect(0,0,surface.width,surface.height);drawChildren(f);
 const proj=(x,y,z=0)=>projectSurface(x,y,z,w,h,v.tiltX||0,v.tiltY||0);
 const corners=[[0,0],[w,0],[w,h],[0,h]],depth=node.depth||0;
 if(depth){c.fillStyle=node.side||'#61466F';for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],p=[proj(...a),proj(...b),proj(...b,-depth),proj(...a,-depth)];c.beginPath();p.forEach(([x,y],n)=>n?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}}
 // Affine rendering is exact for the face-on case and keeps small UI text crisp.
 if(!v.tiltX&&!v.tiltY){c.drawImage(surface,-w/2,-h/2,w,h);return;}
 const cells=6;
 for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){
  const p=[[x*w/cells,y*h/cells],[(x+1)*w/cells,y*h/cells],[(x+1)*w/cells,(y+1)*h/cells],[x*w/cells,(y+1)*h/cells]],q=p.map(a=>proj(...a));
  triangle(c,surface,[p[0],p[1],p[2]],[q[0],q[1],q[2]]);triangle(c,surface,[p[0],p[2],p[3]],[q[0],q[2],q[3]]);
 }
}
