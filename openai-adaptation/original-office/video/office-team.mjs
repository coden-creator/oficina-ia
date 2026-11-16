export const departments=Object.freeze([
 {id:'direccion',name:'Dirección y coordinación',description:'Prioridades, decisiones y bloqueos.',state:'available'},
 {id:'contenido',name:'Marketing y contenido',description:'Investigación, guion, selección, edición y calidad.',state:'preparing'},
 {id:'comercial',name:'Comercial y clientes',description:'Oportunidades, seguimientos y propuestas.',state:'planned'},
 {id:'sistemas',name:'Sistemas y automatización',description:'Integraciones y mejoras. Junie se conectará más adelante.',state:'planned'},
 {id:'administracion',name:'Administración y finanzas',description:'Cobros, gastos y vencimientos.',state:'planned'}
]);
export const team=Object.freeze([
 {id:'coordinador',nombre:'Jarvis',rol:'Coordinación y prioridades',dept:'direccion',color:'#b7a3ff',room:'direccion'},
 {id:'estratega',nombre:'Valeria',rol:'Investigación y contexto',dept:'contenido',color:'#62c8c4',room:'contenido'},
 {id:'guionista',nombre:'Mateo',rol:'Guion y storyboard',dept:'contenido',color:'#f2bb76',room:'contenido'},
 {id:'viralidad',nombre:'Nico',rol:'Selección y revisión creativa',dept:'contenido',color:'#b7a3ff',room:'contenido'},
 {id:'video',nombre:'Lucía',rol:'Edición y dirección visual',dept:'contenido',color:'#ea93b7',room:'edicion'},
 {id:'video2',nombre:'Bruno',rol:'Edición y dirección visual',dept:'contenido',color:'#f2bb76',room:'edicion'},
 {id:'video3',nombre:'Inés',rol:'Edición y dirección visual',dept:'contenido',color:'#82b7eb',room:'edicion'},
 {id:'calidad',nombre:'Control',rol:'Calidad audiovisual',dept:'contenido',color:'#8dc6a4',room:'calidad'}
]);
export const editorIds=Object.freeze(['video','video2','video3']);
export const stageOwners=Object.freeze({research:'estratega',strategy:'estratega',script:'guionista',creative_review:'viralidad',art_direction:'video',production:'video',qa:'calidad',owner_review:'coordinador'});
export const waitingReasons=Object.freeze({WAITING_FOR_OWNER_TEST:'La prueba está esperando el aviso de Jorge.',ORGANIC_WORKER_UPDATE_REQUIRED:'Falta actualizar el contrato del trabajador de contenido.',CODEX_UNAVAILABLE:'Revisar la conexión de Codex.',RESOURCE_LIMIT:'La oficina espera a que baje el uso del servidor.',REFERENCE_PRODUCTION_NOT_CONNECTED:'Falta conectar voz, montaje y control audiovisual.',INTERRUPTED_STAGE:'La ejecución se interrumpió. Se conserva lo completado.',CREATIVE_REVISION_LIMIT:'El guion necesita una decisión tras dos correcciones.',CREATIVE_REJECTED:'La propuesta no pasó la selección creativa.'});
