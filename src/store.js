const db = new Promise((resolve,reject)=>{ const request=indexedDB.open('trill-transcribe',1); request.onupgradeneeded=()=>request.result.createObjectStore('sessions',{keyPath:'id'}); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); });
async function transaction(mode,action) { const database=await db; return new Promise((resolve,reject)=>{ const tx=database.transaction('sessions',mode); let req; try {req=action(tx.objectStore('sessions'));} catch(e){reject(e);return;} tx.oncomplete=()=>resolve(req.result); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error || new Error('Storage transaction aborted')); }); }
export const getAll=()=>transaction('readonly',s=>s.getAll());
export const put=session=>transaction('readwrite',s=>s.put(session));
export const remove=id=>transaction('readwrite',s=>s.delete(id));
