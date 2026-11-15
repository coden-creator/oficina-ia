// Credentials travel only to the authenticated same-origin server, never browser storage.
const descriptions={not_configured:'Todavía no guardaste una clave.',saved:'Clave guardada. Ya puedes verificar la conexión.',verified:'Conexión verificada con ElevenLabs.',invalid:'ElevenLabs rechazó la clave. Revisa si sigue vigente.',permissions_required:'La clave necesita permiso de lectura del usuario (User: Read) para verificarla.',check_failed:'No se pudo verificar ahora. Tu clave sigue guardada.',unavailable:'La configuración de claves aún no está habilitada en esta instalación.'};
export function mountConnectionsPanel(view){
 const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text)x.textContent=text;if(cls)x.className=cls;return x};
 const card=el('section',null,'connections-card');card.setAttribute('aria-labelledby','elevenlabs-title');
 const heading=el('h2','ElevenLabs');heading.id='elevenlabs-title';
 const intro=el('p','La voz de tus videos. Guarda tu clave una vez y verifica que la oficina pueda acceder a tu cuenta.');
 const status=el('p','Cargando conexión…','connection-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const form=el('form');form.autocomplete='off';
 const label=el('label','API key de ElevenLabs');label.htmlFor='elevenlabs-key';
 const field=el('input');field.id='elevenlabs-key';field.name='elevenlabs-key';field.type='password';field.autocomplete='new-password';field.spellcheck=false;field.maxLength=256;field.setAttribute('aria-describedby','elevenlabs-help');
 const help=el('p','Pega la clave completa. Después de guardarla, solo verás si está configurada.','connection-help');help.id='elevenlabs-help';
 const actions=el('div',null,'connection-actions'),save=el('button','Guardar clave'),verify=el('button','Verificar conexión');save.type='submit';save.className='ui-button ui-primary';verify.type='button';verify.className='ui-button';actions.append(save,verify);
 const note=el('p','Guardar y verificar no genera audio ni autoriza consumo de créditos. La generación de voz todavía está pendiente de integración.','connection-help');
 const link=el('a','Abrir claves de ElevenLabs');link.href='https://elevenlabs.io/app/settings/api-keys';link.target='_blank';link.rel='noopener noreferrer';
 form.append(label,field,help,actions);card.append(heading,intro,status,form,note,link);view.append(card);
 let token=null,available=false,configured=false,busy=false;
 function controls(){field.disabled=!available||busy;save.disabled=!available||busy;verify.disabled=!available||busy||!configured;card.setAttribute('aria-busy',String(busy));}
 function present(value){configured=value.configured===true;status.textContent=descriptions[value.status]||'Estado de conexión desconocido.';status.dataset.state=value.status;field.placeholder=configured?'•••••••• · clave guardada':'Pega tu API key';save.textContent=configured?'Reemplazar clave':'Guardar clave';controls();}
 async function load(){try{const r=await fetch('/api/connections',{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw Error();const data=await r.json();available=data.available===true;token=data.csrfToken;present(data.elevenlabs)}catch{available=false;status.textContent='No se pudo cargar la conexión. Vuelve a abrir esta página.';controls()}}
 async function post(path,body){busy=true;controls();try{
  const r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Office-CSRF':token},body:JSON.stringify(body)});
  const result=await r.json();if(!r.ok){status.textContent=result.detail||'No se pudo guardar el cambio. Recarga la página e inténtalo de nuevo.';return false}present(result.elevenlabs);return true;
 }catch{status.textContent='Se perdió la conexión. Verifica el estado antes de volver a guardar.';return false}finally{busy=false;controls()}}
 field.addEventListener('input',()=>{field.removeAttribute('aria-invalid');controls();});
 form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!available)return;const key=field.value.trim();if(!/^[a-zA-Z0-9_-]{16,256}$/.test(key)){status.textContent='Pega la clave completa, sin espacios.';field.setAttribute('aria-invalid','true');field.focus();return}field.value='';await post('/api/connections/elevenlabs',{apiKey:key});});
 verify.addEventListener('click',()=>{if(!busy&&available&&configured)void post('/api/connections/elevenlabs/verify',{});});
 controls();void load();
}
