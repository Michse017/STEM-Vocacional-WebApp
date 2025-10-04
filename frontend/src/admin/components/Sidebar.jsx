import React, { useEffect, useState } from 'react';
import { QuestionnaireList } from './QuestionnaireList';

// Basic sidebar wrapper with search placeholder (future: filter QuestionnaireList)
export function Sidebar({ refreshSignal, onSelectVersion }) {
  const [term, setTerm] = useState('');
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState(null);

  // For next iteration we will pass filtering props to QuestionnaireList; for now just UI shell
  useEffect(() => { if (info) { const t = setTimeout(()=>setInfo(null), 2500); return ()=>clearTimeout(t);} }, [info]);
  return (
    <aside style={{ display:'grid', gap:16 }}>
      <div className='card' style={{ padding:'0.75rem' }}>
        <input className='form-control' value={term} onChange={e=>setTerm(e.target.value)} placeholder='Buscar...' />
        {info && <div style={{ fontSize:11 }}>{info}</div>}
        {err && <div style={{ fontSize:11, color:'crimson' }}>{err}</div>}
      </div>
      <QuestionnaireList refreshSignal={refreshSignal} onSelectVersion={onSelectVersion} onInfo={setInfo} onError={setErr} />
    </aside>
  );
}
