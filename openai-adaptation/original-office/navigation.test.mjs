import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {NAV,BRANDS,routeId,brandId} from './public/navigation.js';
import {createBrandContext} from './public/brand-context.js';
test('approved navigation only, all route identifiers unique',()=>{assert.deepEqual(NAV.map(x=>x.label),['Inicio','Estudio de contenido','Marcas','Calendario','Oficina y equipo','Conexiones y ajustes']);assert.equal(new Set(NAV.map(x=>x.id)).size,6);for(const x of NAV)assert.equal(routeId('#/'+x.id),x.id);});
test('legacy and unknown routes never reveal hidden areas',()=>{for(const path of ['#/ventas','#/tesoreria','#/chat','#/sistema','#/proyectos','', '#/unknown'])assert.equal(routeId(path),'inicio');});
test('brand values validated, no account auto-connection',()=>{assert.deepEqual(BRANDS.map(b=>b.id),['glowfy','velforce','quiba','purify','coden']);for(const b of BRANDS)assert.equal(brandId(b.id),b.id);assert.equal(brandId('../../x'),'glowfy');const code=fs.readFileSync(new URL('./public/navigation.js',import.meta.url),'utf8');assert.ok(!/fetch\(|localStorage|sessionStorage|innerHTML|POST/.test(code));});
test('legacy navigation hidden before JS and source preserved',()=>{const html=fs.readFileSync(new URL('./public/index.html',import.meta.url),'utf8');assert.match(html,/id="tabs"[^>]*hidden inert/);assert.match(html,/id="subnavs"[^>]*hidden inert/);for(const v of ['ventas','tesoreria','cotizaciones','prospeccion'])assert.ok(html.includes('data-view="'+v+'"'));});
test('one brand context protects drafts and locks changes while a request is active',()=>{
 const state=createBrandContext('glowfy');const observed=[];state.subscribe(value=>observed.push(value));
 state.beforeChange(()=>false);assert.equal(state.select('velforce'),false);assert.equal(state.get().id,'glowfy');assert.equal(observed.length,1);
 state.beforeChange(()=>true);state.setBusy(true);assert.equal(state.select('velforce'),false);state.setBusy(false);assert.equal(state.select('velforce'),true);assert.equal(state.get().id,'velforce');assert.equal(observed.at(-1).id,'velforce');
 assert.equal(state.select('../other'),false);assert.equal(state.get().id,'velforce');
});
test('brand revision invalidates late data even after returning to the first brand',()=>{
 const state=createBrandContext('glowfy');const original=state.get();state.select('velforce');state.select('glowfy');assert.equal(state.get().id,original.id);assert.notEqual(state.get().revision,original.revision);
});
