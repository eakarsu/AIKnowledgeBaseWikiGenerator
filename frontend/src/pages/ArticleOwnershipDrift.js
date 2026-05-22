import React, { useEffect, useState } from 'react';
export default function ArticleOwnershipDrift() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/article-ownership-drift').then(r => r.json()).then(setData).catch(() => {}); }, []);
  return <div><h1>Article Ownership Drift</h1><p>Finds high-traffic knowledge articles with stale or inactive ownership.</p>{data?.articles?.map(a => <section className="card" key={a.title}><h2>{a.title}</h2><p>{a.action} - drift {a.drift_score}</p></section>)}</div>;
}
