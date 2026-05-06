import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { isInMonth, getAvailableMonths, getMonthRange } from '../utils/dateUtils';
import { useState } from 'react';

const PIE_COLORS = ['#2563eb','#16a34a','#f59e0b','#dc2626','#8b5cf6','#94a3b8'];
const MAIN_CATS = ['住宅','食費','日用品','特別な支出','趣味・娯楽'];

export default function Dashboard({ transactions, budgets, categories, loading }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState('monthly');
  const [showOthers, setShowOthers] = useState(false);
  const selectedYear = selectedMonth.slice(0, 4);
  const months = getAvailableMonths(transactions);

  const calcTx = (txList) => txList.filter(t => String(t.計算対象) === "1" && t.内容 !== "振替");
  const monthlyTx = calcTx(transactions.filter(t => isInMonth(t.日付, selectedMonth)));
  const yearlyTx = calcTx(transactions.filter(t => t.日付?.slice(0,4) === selectedYear));
  const activeTx = viewMode === 'yearly' ? yearlyTx : monthlyTx;

  const income  = activeTx.filter(t => t.金額 > 0).reduce((s,t) => s + (parseInt(t.金額)||0), 0);
  const expense = Math.abs(activeTx.filter(t => t.金額 < 0).reduce((s,t) => s + (parseInt(t.金額)||0), 0));
  const balance = income - expense;

  const catTotals = {};
  activeTx.filter(t => t.金額 < 0).forEach(t => {
    const cat = t.大項目 || 'その他';
    catTotals[cat] = (catTotals[cat] || 0) + Math.abs(parseInt(t.金額)||0);
  });

  const pieData = (() => {
    const r = {};
    [...MAIN_CATS, 'その他'].forEach(c => r[c] = 0);
    Object.entries(catTotals).forEach(([cat, val]) => {
      if (MAIN_CATS.includes(cat)) r[cat] += val;
      else r['その他'] += val;
    });
    return Object.entries(r).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));
  })();

  const otherDetails = Object.entries(catTotals)
    .filter(([cat]) => !MAIN_CATS.includes(cat))
    .sort((a,b) => b[1]-a[1]);

  const sortedCats = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
  const getCatBudget = (name) => (categories||[]).find(c=>c.name===name)?.budget || 0;
  const maxAmount = sortedCats[0]?.[1] || 1;

  const getBarColor = (pct) => {
    if (pct >= 100) return '#dc2626';
    if (pct >= 80) return `hsl(${Math.round(30-(pct-80)/20*30)},90%,45%)`;
    return `hsl(${Math.round(200-pct/80*170)},80%,45%)`;
  };

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const anchor = x > cx ? 'start' : 'end';
    return (
      <text x={x} y={y} textAnchor={anchor} fill="#374151" dominantBaseline="central">
        <tspan x={x} dy="-0.5em" fontSize={12}>{name} {(percent*100).toFixed(0)}%</tspan>
        <tspan x={x} dy="1.4em" fontSize={10} fill="#6b7280">¥{value.toLocaleString()}</tspan>
      </text>
    );
  };

  if (loading) return <div style={{textAlign:'center',padding:'40px',color:'#94a3b8'}}>読み込み中...</div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1e3a5f',margin:0}}>ダッシュボード</h2>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{display:'flex',borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
            <button onClick={() => setViewMode('monthly')} style={{padding:'6px 14px',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:viewMode==='monthly'?'#1e3a5f':'#fff',color:viewMode==='monthly'?'#fff':'#64748b'}}>月間</button>
            <button onClick={() => setViewMode('yearly')} style={{padding:'6px 14px',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:viewMode==='yearly'?'#1e3a5f':'#fff',color:viewMode==='yearly'?'#fff':'#64748b'}}>年間</button>
          </div>
          {viewMode === 'monthly' ? (
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{padding:'6px 12px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px'}}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <select value={selectedYear} onChange={e => setSelectedMonth(e.target.value+'-01')} style={{padding:'6px 12px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px'}}>
              {[...new Set(months.map(m=>m.slice(0,4)))].map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
          )}
        </div>
      </div>

      <div style={{fontSize:11,color:'#94a3b8',marginBottom:16,textAlign:'right'}}>
        {viewMode === 'monthly'
          ? (() => {
              const {start, end} = getMonthRange(selectedMonth);
              const fmt = (d) => `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`;
              return `集計期間：${fmt(start)} 〜 ${fmt(end)}`;
            })()
          : (() => {
              const months = [...Array(12)].map((_,i) => `${selectedYear}-${String(i+1).padStart(2,'0')}`);
              const {start} = getMonthRange(months[0]);
              const {end} = getMonthRange(months[11]);
              const fmt = (d) => `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日(${'日月火水木金土'[d.getDay()]})`;
              return `集計期間：${fmt(start)} 〜 ${fmt(end)}`;
            })()
        }
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'20px'}}>
        {[{label:'収入',value:income,color:'#2563eb'},{label:'支出',value:expense,color:'#dc2626'},{label:'収支',value:balance,color:balance>=0?'#16a34a':'#dc2626'}].map(({label,value,color}) => (
          <div key={label} style={{background:'#fff',borderRadius:'12px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <p style={{fontSize:'11px',color:'#94a3b8',margin:'0 0 6px'}}>{label}</p>
            <p style={{fontSize:'22px',fontWeight:'700',color,margin:0}}>{value>=0?'':'-'}¥{Math.abs(value).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div style={{background:'#fff',borderRadius:'12px',padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:'20px'}}>
        <h3 style={{fontSize:'14px',fontWeight:'700',color:'#1e3a5f',marginBottom:'16px'}}>支出内訳</h3>
        {pieData.length === 0 ? <p style={{color:'#94a3b8',fontSize:'13px'}}>データがありません</p> : (
          <>
            <div onClick={(e) => { if (e.target.tagName === 'svg' || e.target.classList.contains('recharts-wrapper')) setShowOthers(false); }} style={{position:'relative'}}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={showOthers ? otherDetails.map(([name,value])=>({name,value})) : pieData}
                  onClick={(data) => { if (data?.name === 'その他') setShowOthers(true); else if (showOthers) setShowOthers(false); }}
                  cx="50%" cy="50%" innerRadius={30} outerRadius={110} paddingAngle={3} dataKey="value"
                  label={renderLabel} labelLine={true}
                  cursor="pointer">
                  {(showOthers ? otherDetails.map(([n,v])=>({name:n,value:v})) : pieData).map((_,i) => <Cell key={i} fill={PIE_COLORS[i%6]} />)}
                </Pie>
                
              </PieChart>
            </ResponsiveContainer>
            </div>
            
            <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:16}}>
              {sortedCats.map(([name, value],i) => {
                const budget = getCatBudget(name);
                const pct = budget > 0 ? Math.min((value/budget)*100,100) : 0;
                const isOver = budget > 0 && value > budget;
                const colorIdx = pieData.findIndex(p => p.name === name);
                const color = colorIdx >= 0 ? PIE_COLORS[colorIdx%6] : '#cbd5e1';
                const isOther = name === 'その他';
                return (
                  <div key={name} onClick={() => isOther && setShowOthers(s=>!s)}
                    style={{padding:'6px 10px',borderRadius:6,cursor:isOther?'pointer':'default',background:isOther?'#f8fafc':'transparent',border:isOther?'1px solid #e2e8f0':'none'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom: budget>0 ? 4 : 0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:10,height:10,borderRadius:2,background:color,flexShrink:0}} />
                        <span style={{fontSize:13,color:'#1e293b'}}>{name}</span>
                      </div>
                      <div style={{fontSize:13}}>
                        <span style={{fontWeight:700,color:isOver?'#dc2626':'#1e293b'}}>¥{value.toLocaleString()}</span>
                        {budget > 0 && <span style={{color:'#94a3b8',marginLeft:4}}>/ ¥{budget.toLocaleString()}</span>}
                        {isOver && <span style={{color:'#dc2626',marginLeft:4,fontSize:11}}>超過</span>}
                      </div>
                    </div>
                    <div style={{marginTop:4}}>
                      <div style={{background:"#f0f0f0",borderRadius:4,height:8,overflow:"hidden",position:"relative"}}>
                        <div style={{width:`${budget>0?pct:Math.min((value/maxAmount)*100,100)}%`,height:"100%",borderRadius:4,background:getBarColor(budget>0?pct:Math.min((value/maxAmount)*100,100)),transition:"width 0.3s"}} />
                        {[20,40,60,80].map(t => <div key={t} style={{position:"absolute",top:0,left:`${t}%`,width:1,height:"100%",background:"rgba(255,255,255,0.5)"}} />)}
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#cbd5e1",marginTop:1}}>
                        {["0","20","40","60","80","100"].map(t => <span key={t}>{t}%</span>)}
                      </div>
                      {budget>0 && <div style={{textAlign:"right",fontSize:10,color:"#94a3b8",fontWeight:600,marginTop:1}}>{Math.round(pct)}%</div>}
                    </div>
                  </div>
                );
              })}
            </div>

          {showOthers && otherDetails.length > 0 && (
              <div style={{marginTop:10,background:'#f8fafc',borderRadius:8,padding:'10px 14px',border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#64748b',marginBottom:6}}>その他の内訳</div>
                {otherDetails.map(([cat,val]) => (
                  <div key={cat} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0',borderBottom:'1px solid #f0f0f0'}}>
                    <span style={{color:'#475569'}}>{cat}</span>
                    <span style={{fontWeight:600}}>¥{val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>


    </div>
  );
}
