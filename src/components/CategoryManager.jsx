import { useState } from 'react';

const DEFAULT_CATEGORIES = [
  { id: 1,  name: '食費',      icon: '🍜', color: '#f59e0b', subcategories: [], budget: 0, isDefault: true },
  { id: 2,  name: '日用品',    icon: '🛒', color: '#0891b2', subcategories: [], budget: 0, isDefault: true },
  { id: 3,  name: '教養・教育', icon: '📚', color: '#ca8a04', subcategories: [], budget: 0, isDefault: true },
  { id: 4,  name: '趣味・娯楽', icon: '🎮', color: '#8b5cf6', subcategories: [], budget: 0, isDefault: true },
  { id: 5,  name: '衣服・美容', icon: '👗', color: '#be185d', subcategories: [], budget: 0, isDefault: true },
  { id: 6,  name: '健康・医療', icon: '🏥', color: '#16a34a', subcategories: [], budget: 0, isDefault: true },
  { id: 7,  name: 'その他',    icon: '📦', color: '#94a3b8', subcategories: [], budget: 0, isDefault: true },
  { id: 8,  name: '交通費',    icon: '🚃', color: '#0d9488', subcategories: [], budget: 0, isDefault: true },
  { id: 9,  name: '交際費',    icon: '🤝', color: '#f97316', subcategories: [], budget: 0, isDefault: true },
  { id: 10, name: '住宅',      icon: '🏠', color: '#2563eb', subcategories: [], budget: 0, isDefault: true },
  { id: 11, name: '水道・光熱費', icon: '💡', color: '#0284c7', subcategories: [], budget: 0, isDefault: true },
  { id: 12, name: '通信費',    icon: '📱', color: '#7c3aed', subcategories: [], budget: 0, isDefault: true },
  { id: 13, name: '保険',      icon: '🛡️', color: '#64748b', subcategories: [], budget: 0, isDefault: true },
  { id: 14, name: '特別な支出', icon: '⭐', color: '#dc2626', subcategories: [], budget: 0, isDefault: true },
  { id: 15, name: '税・社会保障', icon: '🏛️', color: '#475569', subcategories: [], budget: 0, isDefault: true },
  { id: 16, name: '自動車',    icon: '🚗', color: '#854d0e', subcategories: [], budget: 0, isDefault: true },
];

const toSubObj = (s) => typeof s === "string" ? { name: s, budget: 0 } : s;
export default function CategoryManager({ categories, setCategories }) {
  const [cats, setCats] = useState((categories.length > 0 ? categories : DEFAULT_CATEGORIES).map(c => ({ ...c, subcategories: (c.subcategories || []).map(toSubObj) })));
  const [editing, setEditing] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', icon: '📦', color: '#2563eb', budget: 0 });
  const [newSubcat, setNewSubcat] = useState('');

  const save = (updated) => { setCats(updated); setCategories(updated); };

  const addCategory = () => {
    if (!newCat.name) return;
    save([...cats, { id: Date.now(), ...newCat, subcategories: [], budget: newCat.budget || 0, isDefault: false }]);
    setNewCat({ name: '', icon: '📦', color: '#2563eb', budget: 0 });
  };

  const deleteCategory = (id, isDefault) => {
    if (isDefault) {
      alert('マネーフォワードのデフォルトカテゴリは削除できません');
      return;
    }
    if (!confirm('このカテゴリを削除しますか？')) return;
    save(cats.filter(c => c.id !== id));
    if (editing === id) setEditing(null);
  };

  const updateBudget = (catId, val) => {
    save(cats.map(c => c.id === catId ? { ...c, budget: parseInt(val) || 0 } : c));
  };

  const updateSubBudget = (catId, subName, val) => {
    const cat = cats.find(c => c.id === catId);
    const subTotal = cat.subcategories.filter(s => s.name !== subName).reduce((sum, s) => sum + (s.budget || 0), 0);
    const remaining = (cat.budget || 0) - subTotal;
    const newVal = Math.min(parseInt(val) || 0, remaining);
    save(cats.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.map(s => s.name === subName ? { ...s, budget: newVal } : s) } : c));
  };
  const addSubcategory = (catId) => {
    if (!newSubcat) return;
    save(cats.map(c => c.id === catId ? { ...c, subcategories: [...(c.subcategories || []), { name: newSubcat, budget: 0 }] } : c));
    setNewSubcat('');
  };

  const deleteSubcategory = (catId, sub) => {
    save(cats.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.name !== sub) } : c));
  };

  return (
    <div>
      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#1e3a5f' }}>新しいカテゴリを追加</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))}
            style={{ width: '50px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '16px', textAlign: 'center' }} />
          <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
            placeholder="カテゴリ名" style={{ flex: 1, minWidth: '120px', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
          <input type="number" placeholder="月予算" value={newCat.budget || ''} onChange={e => setNewCat(p => ({ ...p, budget: parseInt(e.target.value) || 0 }))}
            style={{ width: '100px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
          <input type="color" value={newCat.color} onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))}
            style={{ width: '40px', height: '34px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }} />
          <button onClick={addCategory}
            style={{ padding: '6px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            追加
          </button>
        </div>
      </div>

      {cats.map(cat => (
        <div key={cat.id} style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: cat.isDefault ? '3px solid #2563eb' : '3px solid transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing === cat.id ? '12px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{cat.icon}</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{cat.name}</span>
              {cat.isDefault && <span style={{ fontSize: '10px', background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '999px' }}>MF標準</span>}
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" placeholder="月予算" value={cat.budget || ''} onChange={e => updateBudget(cat.id, e.target.value)}
                style={{ width: '90px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }} />
              <button onClick={() => setEditing(editing === cat.id ? null : cat.id)}
                style={{ padding: '4px 10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#475569' }}>
                {editing === cat.id ? '閉じる' : 'サブカテゴリ'}
              </button>
              <button onClick={() => deleteCategory(cat.id, cat.isDefault)}
                style={{ padding: '4px 10px', background: cat.isDefault ? '#f1f5f9' : '#fef2f2', border: 'none', borderRadius: '6px', cursor: cat.isDefault ? 'not-allowed' : 'pointer', fontSize: '12px', color: cat.isDefault ? '#94a3b8' : '#dc2626' }}>
                {cat.isDefault ? '🔒' : '削除'}
              </button>
            </div>
          </div>

          {editing === cat.id && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {(cat.subcategories || []).map(sub => {
                  const subName = sub.name || sub;
                  const subBudget = sub.budget || 0;
                  const remainBudget = (cat.budget || 0) - (cat.subcategories || []).filter(s => (s.name||s) !== subName).reduce((sum, s) => sum + (s.budget||0), 0);
                  return (
                  <div key={subName} style={{ width: '100%', background: '#f8fafc', borderRadius: '6px', padding: '8px 10px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: subBudget > 0 ? '6px' : '0' }}>
                      <span style={{ flex: 1, fontSize: '12px', color: '#2563eb' }}>{subName}</span>
                      <input type="number" placeholder="サブ予算" value={subBudget || ''} onChange={e => updateSubBudget(cat.id, subName, e.target.value)}
                        style={{ width: '80px', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }} />
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>残{(remainBudget - subBudget).toLocaleString()}円</span>
                      <button onClick={() => deleteSubcategory(cat.id, subName)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '0', lineHeight: 1 }}>×</button>
                    </div>
                    {subBudget > 0 && cat.budget > 0 && (
                      <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '4px' }}>
                        <div style={{ width: Math.min((subBudget/cat.budget)*100, 100)+'%', height: '4px', borderRadius: '4px', background: '#2563eb' }} />
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={newSubcat} onChange={e => setNewSubcat(e.target.value)}
                  placeholder="サブカテゴリ名" onKeyDown={e => e.key === 'Enter' && addSubcategory(cat.id)}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }} />
                <button onClick={() => addSubcategory(cat.id)}
                  style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  追加
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}