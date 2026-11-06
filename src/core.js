export const MODES = {
 radio: {name:'Radio chatter', icon:'◉', description:'For dispatch, scanners, broadcasts and other compressed or noisy speech. Review names, codes and numbers carefully.'},
 media: {name:'Media & streams', icon:'▶', description:'Play an audio or video file, or open a direct media URL. Downloadable files can be transcribed on this device.'},
 conversation: {name:'Live conversation', icon:'◎', description:'Use your microphone for a conversation in the room. Live recognition depends on your browser and may use its online speech service.'},
 calls: {name:'Phone conversation', icon:'☎', description:'Use the microphone with speakerphone only where everyone has consented. Android and browsers generally cannot capture both sides of a call directly.'}
};
export function majority(values) { const counts = new Map(); for (const v of values) { const key = v.trim().replace(/\s+/g,' ').toLocaleLowerCase(); if (!key) continue; const entry=counts.get(key)||{count:0,text:v.trim()}; entry.count++; counts.set(key,entry); } return [...counts.values()].sort((a,b)=>b.count-a.count)[0] || null; }
export function formatDate(date) { return new Date(date).toLocaleString(); }
export function safeName(value) { return (value || 'transcript').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'').slice(0,60) || 'transcript'; }
