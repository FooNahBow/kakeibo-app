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
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={showOthers ? otherDetails.map(([name,value])=>({name,value})) : pieData}
                  cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value"
                  label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={true}>
                  {(showOthers ? otherDetails : pieData).map((_,i) => <Cell key={i} fill={PIE_COLORS[i%6]} />)}
                </Pie>
                <Tooltip formatter={(value) => "¥"+value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
            {showOthers && <div style={{textAlign:'center',fontSize:11,color:'#94a3b8',marginTop:4}}>その他の内訳を表示中</div>}
            <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:16}}>
              {pieData.map((entry,i) => (
                <div key={entry.name}
                  onClick={() => entry.name==='その他' && setShowOthers(s=>!s)}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderRadius:6,
                    background:entry.name==='その他'?'#f8fafc':'transparent',
                    border:entry.name==='その他'?'1px solid #e2e8f0':'none',
                    cursor:entry.name==='その他'?'pointer':'default'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:10,height:10,borderRadius:2,background:PIE_COLORS[i%6],flexShrink:0}} />
                    <span style={{fontSize:13,color:'#1e293b'}}>{entry.name}</span>
                    {entry.name==='その他' && <span style={{fontSize:10,color:'#94a3b8'}}>{showOthers?'▲ 閉じる':'▼ 内訳を見る'}</span>}
                  </div>
                  <span style={{fontWeight:700,fontSize:13}}>¥{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

          </>
        )}
      </div>

      <div style={{background:'#fff',borderRadius:'12px',padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:'20px'}}>
        <h3 style={{fontSize:'14px',fontWeight:'700',color:'#1e3a5f',marginBottom:'16px'}}>カテゴリ別支出</h3>
        {sortedCats.length === 0 ? <p style={{color:'#94a3b8',fontSize:'13px'}}>データがありません</p> : (
          sortedCats.map(([cat,amount]) => {
            const budget = getCatBudget(cat);
            const pct = budget > 0 ? Math.min((amount/budget)*100,100) : (amount/maxAmount)*100;
            const isOver = budget > 0 && amount > budget;
            return (
              <div key={cat} style={{marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                  <span style={{color:'#1e293b'}}>{cat}</span>
                  <div>
                    <span style={{fontWeight:'600',color:isOver?'#dc2626':'#1e293b'}}>¥{amount.toLocaleString()}</span>
                    {budget > 0 && <span style={{color:'#94a3b8',marginLeft:'4px'}}>/ ¥{budget.toLocaleString()}</span>}
                    {isOver && <span style={{color:'#dc2626',marginLeft:'4px',fontSize:'11px'}}>超過</span>}
                  </div>
                </div>
                <div style={{background:'#f0f0f0',borderRadius:'4px',height:'8px'}}>
                  <div style={{width:`${pct}%`,height:'8px',borderRadius:'4px',background:getBarColor(budget>0?(amount/budget)*100:0)}} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
