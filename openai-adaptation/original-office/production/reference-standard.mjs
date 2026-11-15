// Product requirement supplied by Jorge. Metadata does not certify artistic quality.
export const REFERENCE_STANDARD='cresova-reference-v1';
export const DIAGNOSTIC_STANDARD='technical-test';
export const productionRequirements=Object.freeze([
 'storyboard-with-actions-and-continuity',
 'detailed-brand-specific-scenes',
 'authorized-narration-and-word-alignment',
 'synchronized-sound-and-measured-mix',
 'mobile-readable-captions',
 'post-render-audiovisual-review',
 'owner-review-of-exact-version'
]);
export function validateQualityStandard(value){
 if(![REFERENCE_STANDARD,DIAGNOSTIC_STANDARD].includes(value))throw Error('UNKNOWN_QUALITY_STANDARD');
 return value;
}
export function productionCapability(){
 // Both currently connected renderers implement diagnostic cards only. A title,
 // model verdict or self-reported profile must never silently enable production.
 return {standard:REFERENCE_STANDARD,ready:false,reason:'REFERENCE_PRODUCTION_NOT_CONNECTED',requirements:[...productionRequirements]};
}
export function requireProductionCapability(standard){
 validateQualityStandard(standard);
 if(standard===REFERENCE_STANDARD&&!productionCapability().ready)throw Error('REFERENCE_PRODUCTION_NOT_CONNECTED');
}
