import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';

// ─── Grade system ────────────────────────────────────────────────────────────
const gradePoints = {
  'A+': 4.00, 'A': 3.75, 'A-': 3.50,
  'B+': 3.25, 'B': 3.00, 'B-': 2.75,
  'C+': 2.50, 'C': 2.25, 'C-': 2.00,
  'D+': 1.75, 'D': 1.50, 'F': 0.00,
};
const gradeLabels = {
  'A+':'Outstanding','A':'Excellent','A-':'Very Good',
  'B+':'Good','B':'Satisfactory','B-':'Above Average',
  'C+':'Average','C':'Below Average','C-':'Marginal',
  'D+':'Poor','D':'Very Poor','F':'Fail',
};
const gradeColors = {
  'A+':'bg-emerald-100 text-emerald-800','A':'bg-emerald-100 text-emerald-700',
  'A-':'bg-teal-100 text-teal-700','B+':'bg-blue-100 text-blue-700',
  'B':'bg-blue-100 text-blue-600','B-':'bg-indigo-100 text-indigo-600',
  'C+':'bg-yellow-100 text-yellow-700','C':'bg-yellow-100 text-yellow-600',
  'C-':'bg-orange-100 text-orange-600','D+':'bg-red-100 text-red-600',
  'D':'bg-red-100 text-red-500','F':'bg-gray-100 text-gray-500',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => String(Date.now() + (++_id));
const newCourse   = () => ({ id: uid(), name: '', credit: '', grade: '' });
const newSemester = () => ({
  id: uid(), name: '', sgpa: '', totalCredits: '',
  mode: 'direct', courses: [newCourse()], expanded: true,
});

const SYMBOLS = ['+', '−', '×', '÷', '='];

// ─── Main component ───────────────────────────────────────────────────────────
export default function App() {

  // ── Theme ────────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('cgpa-theme') === 'dark'; } catch { return false; }
  });
  const [animDir, setAnimDir] = useState(null); // 'to-dark' | 'to-light' | null

  useEffect(() => {
    try { localStorage.setItem('cgpa-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  const toggleTheme = () => {
    if (animDir) return;
    const dir = dark ? 'to-light' : 'to-dark';
    setAnimDir(dir);
    setTimeout(() => { setDark(p => !p); setAnimDir(null); }, 560);
  };

  // ── Data ─────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('current');

  const [courses, setCourses] = useState(() => {
    try { const s = localStorage.getItem('cgpa-courses'); return s ? JSON.parse(s) : [newCourse()]; }
    catch { return [newCourse()]; }
  });

  const [prevSems, setPrevSems] = useState(() => {
    try { const s = localStorage.getItem('cgpa-prevSems'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [saveStatus, setSaveStatus] = useState('saved');

  // ── Auto-save ────────────────────────────────────────────────────────────
  useEffect(() => {
    setSaveStatus('saving');
    const t = setTimeout(() => {
      try {
        localStorage.setItem('cgpa-courses',  JSON.stringify(courses));
        localStorage.setItem('cgpa-prevSems', JSON.stringify(prevSems));
        setSaveStatus('saved');
      } catch { setSaveStatus('error'); }
    }, 600);
    return () => clearTimeout(t);
  }, [courses, prevSems]);

  // ── Ripple ───────────────────────────────────────────────────────────────
  const [ripples, setRipples] = useState([]);
  const lastRipple = useRef(0);

  const handleClick = useCallback((e) => {
    const now = Date.now();
    if (now - lastRipple.current < 160) return;
    const tag = e.target.tagName?.toLowerCase() || '';
    if (['button','input','select','textarea','a','label'].includes(tag)) return;
    if (e.target.closest('button,input,select,textarea,a,label')) return;
    lastRipple.current = now;
    const id = now;
    setRipples(r => [...r.slice(-10), { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 1000);
  }, []);

  // ── Calculations ─────────────────────────────────────────────────────────
  const calcSGPA = (list) => {
    let pts = 0, cr = 0;
    list.forEach(c => {
      const credit = parseFloat(c.credit);
      const gp     = gradePoints[c.grade];
      if (!isNaN(credit) && credit > 0 && gp !== undefined) { pts += credit * gp; cr += credit; }
    });
    return cr > 0 ? pts / cr : 0;
  };

  const getSemSGPA    = s => s.mode === 'direct' ? (parseFloat(s.sgpa) || 0) : calcSGPA(s.courses);
  const getSemCredits = s => s.mode === 'direct'
    ? (parseFloat(s.totalCredits) || 0)
    : s.courses.reduce((acc, c) => acc + (parseFloat(c.credit) || 0), 0);

  const currentSGPA    = calcSGPA(courses);
  const currentCredits = courses.reduce((acc, c) => acc + (parseFloat(c.credit) || 0), 0);

  // Valid previous = has both SGPA > 0 and Credits > 0
  const validPrev    = prevSems.filter(s => getSemSGPA(s) > 0 && getSemCredits(s) > 0);
  const hasValidPrev = validPrev.length > 0;

  // Final CGPA = weighted average of PREVIOUS semesters ONLY
  // Current semester is independent — never merged into Final CGPA
  const finalCGPA = (() => {
    if (!hasValidPrev) return 0;
    let pts = 0, cr = 0;
    validPrev.forEach(s => { pts += getSemSGPA(s) * getSemCredits(s); cr += getSemCredits(s); });
    return cr > 0 ? pts / cr : 0;
  })();

  // ── Course handlers ───────────────────────────────────────────────────────
  const addCourse    = () => setCourses(c => [...c, newCourse()]);
  const removeCourse = (id) => { if (courses.length > 1) setCourses(c => c.filter(x => x.id !== id)); };
  const updateCourse = (id, field, val) => setCourses(c => c.map(x => {
    if (x.id !== id) return x;
    if (field === 'credit') {
      const v = parseFloat(val);
      if (val !== '' && (isNaN(v) || v < 0 || v > 20)) return x;
    }
    return { ...x, [field]: val };
  }));

  // ── Semester handlers ────────────────────────────────────────────────────
  const addSemester    = () => setPrevSems(s => [...s, newSemester()]);
  const removeSemester = (id) => setPrevSems(s => s.filter(x => x.id !== id));
  const updateSemester = (id, field, val) => setPrevSems(s => s.map(sem => {
    if (sem.id !== id) return sem;
    if (field === 'sgpa') {
      const v = parseFloat(val);
      if (val !== '' && (isNaN(v) || v < 0 || v > 4)) return sem;
    }
    if (field === 'totalCredits') {
      const v = parseFloat(val);
      if (val !== '' && (isNaN(v) || v < 0 || v > 100)) return sem;
    }
    return { ...sem, [field]: val };
  }));
  const addSemCourse    = (semId) => setPrevSems(s => s.map(sem =>
    sem.id === semId ? { ...sem, courses: [...sem.courses, newCourse()] } : sem
  ));
  const removeSemCourse = (semId, cId) => setPrevSems(s => s.map(sem => {
    if (sem.id !== semId || sem.courses.length <= 1) return sem;
    return { ...sem, courses: sem.courses.filter(c => c.id !== cId) };
  }));
  const updateSemCourse = (semId, cId, field, val) => setPrevSems(s => s.map(sem => {
    if (sem.id !== semId) return sem;
    return {
      ...sem,
      courses: sem.courses.map(c => {
        if (c.id !== cId) return c;
        if (field === 'credit') {
          const v = parseFloat(val);
          if (val !== '' && (isNaN(v) || v < 0 || v > 20)) return c;
        }
        return { ...c, [field]: val };
      }),
    };
  }));

  // ── Theme-aware class shortcuts ───────────────────────────────────────────
  const d = dark;
  const T = {
    page:      d ? 'bg-gray-950'    : 'bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50',
    card:      d ? 'bg-gray-900 border-gray-800'  : 'bg-white border-gray-100',
    inner:     d ? 'bg-gray-800 border-gray-700'  : 'bg-gray-50 border-gray-100',
    text:      d ? 'text-gray-100'  : 'text-gray-800',
    textSec:   d ? 'text-gray-400'  : 'text-gray-500',
    textMut:   d ? 'text-gray-600'  : 'text-gray-400',
    label:     d ? 'text-gray-300'  : 'text-gray-600',
    divider:   d ? 'divide-gray-800 border-gray-800' : 'divide-gray-100 border-gray-100',
    input:     d ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                 : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400',
    select:    d ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-indigo-500'
                 : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-indigo-400',
    tabBar:    d ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-transparent',
    tabOn:     'bg-indigo-600 text-white shadow-md',
    tabOff:    d ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
    modeBar:   d ? 'bg-gray-800' : 'bg-gray-100',
    modeOn:    d ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-sm',
    modeOff:   d ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700',
    statCard:  d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100',
    statFinal: d ? 'bg-gradient-to-br from-indigo-950 to-purple-950 border-indigo-900'
                 : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100',
    statVal:   d ? 'text-indigo-400' : 'text-indigo-600',
    statFinalVal: d ? 'text-indigo-300' : 'text-indigo-700',
    badgeIn:   d ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-600',
    badgePu:   d ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-600',
    badgeGr:   d ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-50 text-emerald-600',
    addIn:     d ? 'border-indigo-700 text-indigo-400 hover:border-indigo-500 hover:bg-indigo-900/20'
                 : 'border-indigo-400 text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50',
    addPu:     d ? 'border-purple-700 text-purple-400 hover:border-purple-500 hover:bg-purple-900/20'
                 : 'border-purple-400 text-purple-600 hover:border-purple-600 hover:bg-purple-50',
    themeBtn:  d ? 'bg-indigo-900/50 border border-indigo-800 hover:bg-indigo-800/70'
                 : 'bg-amber-50 border border-amber-200 hover:bg-amber-100',
    stickyBg:  d ? 'bg-gray-950' : 'bg-gradient-to-b from-slate-50 via-indigo-50/90 to-transparent',
    trashOn:   d ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50',
    trashOff:  d ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-500 ${T.page}`} onClick={handleClick}>

      {/* CSS */}
      <style>{`
        @keyframes rippleWave {
          0%   { transform: translate(-50%,-50%) scale(0.2); opacity: 0.85; }
          100% { transform: translate(-50%,-50%) scale(2.6); opacity: 0; }
        }
        @keyframes iconSet  { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(120%);opacity:0} }
        @keyframes iconRise { 0%{transform:translateY(120%);opacity:0} 100%{transform:translateY(0);opacity:1} }
        .icon-set  { animation: iconSet  0.52s cubic-bezier(.4,0,1,1) forwards; }
        .icon-rise { animation: iconRise 0.52s cubic-bezier(0,0,.6,1) .06s forwards; }
      `}</style>

      {/* Ripple overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {ripples.map(rp => (
          <div key={rp.id} style={{ position:'absolute', left:rp.x, top:rp.y }}>
            {[0,1].map(w => (
              <div key={w} style={{
                position:'absolute',
                animation:`rippleWave 1s ease-out ${w*0.18}s forwards`,
              }}>
                {SYMBOLS.map((sym, si) => {
                  const angle = (si / SYMBOLS.length) * Math.PI * 2;
                  return (
                    <span key={si} style={{
                      position:'absolute', left:'50%', top:'50%',
                      transform:`translate(calc(-50% + ${Math.cos(angle)*22}px), calc(-50% + ${Math.sin(angle)*22}px))`,
                      fontSize:'10px', fontWeight:700, userSelect:'none',
                      color: d ? 'rgba(129,140,248,0.75)' : 'rgba(99,102,241,0.65)',
                    }}>{sym}</span>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">

        {/* ── Header (not sticky) ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl overflow-hidden ${d ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}
                 style={{ width:48, height:48 }}>
              <img src="/logo192.png" alt="CGPA Calc"
                   style={{ width:48, height:48, objectFit:'contain', display:'block' }} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${T.text}`}>CGPA Calculator</h1>
              <p className={`text-sm ${T.textSec}`}>UGC Uniform Grading System</p>
            </div>
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${T.themeBtn}`}
            title={d ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <div style={{ width:22, height:22, position:'relative', overflow:'hidden' }}>
              {/* Sun */}
              <div className={animDir === 'to-dark' ? 'icon-set' : animDir === 'to-light' ? 'icon-rise' : ''}
                   style={{
                     position:'absolute', inset:0, display:'flex',
                     alignItems:'center', justifyContent:'center',
                     transform: animDir ? undefined : (d ? 'translateY(120%)' : 'translateY(0%)'),
                     opacity:   animDir ? undefined : (d ? 0 : 1),
                   }}>
                <Sun style={{ width:18, height:18, color:'#f59e0b' }} />
              </div>
              {/* Moon */}
              <div className={animDir === 'to-dark' ? 'icon-rise' : animDir === 'to-light' ? 'icon-set' : ''}
                   style={{
                     position:'absolute', inset:0, display:'flex',
                     alignItems:'center', justifyContent:'center',
                     transform: animDir ? undefined : (d ? 'translateY(0%)' : 'translateY(120%)'),
                     opacity:   animDir ? undefined : (d ? 1 : 0),
                   }}>
                <Moon style={{ width:18, height:18, color:'#a5b4fc' }} />
              </div>
            </div>
          </button>
        </div>

        {/* Save status */}
        <div className={`flex items-center gap-2 mb-4 text-xs ${
          saveStatus==='saving' ? (d?'text-amber-400':'text-amber-500') :
          saveStatus==='error'  ? (d?'text-red-400'  :'text-red-500')   :
                                   (d?'text-emerald-400':'text-emerald-600')
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            saveStatus==='saving' ? 'bg-amber-400 animate-pulse' :
            saveStatus==='error'  ? 'bg-red-400' : 'bg-emerald-400'
          }`} />
          {saveStatus==='saving' ? 'Saving...' :
           saveStatus==='error'  ? 'Failed to save' : 'Data saved automatically'}
        </div>

        {/* ════════════════════════════════════════════════════
            STICKY BLOCK — Stats card(s) + Tabs
            Rules:
            • current tab   → only "Current Semester SGPA" card
            • previous tab  → "Previous Semesters" count card
                              + "Final CGPA" card (only if valid prev data)
            • reference tab → NO stats card
        ════════════════════════════════════════════════════ */}
        <div className={`sticky top-0 z-10 -mx-4 px-4 pt-2 pb-4 ${T.stickyBg}`}>

          {/* Current tab stats */}
          {tab === 'current' && (
            <div className={`rounded-2xl p-4 border shadow-sm mb-3 ${T.statCard}`}>
              <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${T.textMut}`}>
                Current Semester SGPA
              </p>
              <p className={`text-3xl font-bold ${T.statVal}`}>{currentSGPA.toFixed(2)}</p>
            </div>
          )}

          {/* Previous tab stats */}
          {tab === 'previous' && (
            <div className={`grid gap-3 mb-3 ${hasValidPrev ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className={`rounded-2xl p-4 border shadow-sm ${T.statCard}`}>
                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${T.textMut}`}>
                  Previous Semesters
                </p>
                <p className={`text-3xl font-bold ${T.statVal}`}>{validPrev.length}</p>
              </div>
              {hasValidPrev && (
                <div className={`rounded-2xl p-4 border shadow-sm ${T.statFinal}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${T.textMut}`}>
                    Final CGPA
                  </p>
                  <p className={`text-3xl font-bold ${T.statFinalVal}`}>{finalCGPA.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Grade Reference tab — NO stats card, just tabs below */}

          {/* Tabs */}
          <div className={`flex rounded-2xl p-1 border ${T.tabBar}`}>
            {[
              { key:'current',   label:'Current Semester'  },
              { key:'previous',  label:'Previous Semesters'},
              { key:'reference', label:'Grade Reference'   },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  tab === t.key ? T.tabOn : T.tabOff
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            TAB CONTENT
        ════════════════════════════════════════════════════ */}
        <div className="mt-5">

          {/* ── Current Semester ── */}
          {tab === 'current' && (
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${T.card}`}>
              <div className={`px-5 py-4 border-b ${T.divider} flex items-center gap-2`}>
                <BookOpen className={`w-4 h-4 ${d?'text-indigo-400':'text-indigo-500'}`} />
                <h2 className={`text-sm font-semibold ${T.text}`}>Current Semester Courses</h2>
              </div>
              <div className="p-5 space-y-4">
                {courses.map((course, idx) => (
                  <div key={course.id} className={`rounded-xl p-4 border ${T.inner}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${T.badgeIn}`}>
                        Course {idx + 1}
                      </span>
                      <button onClick={() => removeCourse(course.id)} disabled={courses.length === 1}
                        className={`p-1.5 rounded-lg transition-colors ${courses.length===1 ? T.trashOff : T.trashOn}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${T.label}`}>Course Name</label>
                        <input type="text" value={course.name} placeholder="e.g., Data Structures"
                          onChange={e => updateCourse(course.id, 'name', e.target.value)}
                          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${T.input}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${T.label}`}>Credit Hours</label>
                          <input type="number" value={course.credit} placeholder="e.g., 3"
                            min="0" max="20" step="0.5"
                            onChange={e => updateCourse(course.id, 'credit', e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${T.input}`} />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${T.label}`}>Grade</label>
                          <select value={course.grade}
                            onChange={e => updateCourse(course.id, 'grade', e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${T.select}`}>
                            <option value="">Select Grade</option>
                            {Object.entries(gradePoints).map(([g,p]) => (
                              <option key={g} value={g}>{g} ({p.toFixed(2)})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addCourse}
                  className={`w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors ${T.addIn}`}>
                  <Plus className="w-4 h-4" /> Add Course
                </button>
              </div>
            </div>
          )}

          {/* ── Previous Semesters ── */}
          {tab === 'previous' && (
            <div className="space-y-4">
              {prevSems.length === 0 && (
                <div className={`rounded-2xl border shadow-sm p-8 text-center ${T.card}`}>
                  <p className={`text-sm ${T.textSec}`}>No previous semesters added yet.</p>
                </div>
              )}

              {prevSems.map((sem, idx) => {
                const semSGPA = getSemSGPA(sem);
                return (
                  <div key={sem.id} className={`rounded-2xl border shadow-sm overflow-hidden ${T.card}`}>

                    {/* Semester header */}
                    <div className={`px-5 py-3 border-b ${T.divider} flex items-center gap-2 flex-wrap`}>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${T.badgePu}`}>
                        Semester {idx + 1}
                      </span>
                      <input type="text" value={sem.name} placeholder="e.g., Fall 2023"
                        onChange={e => updateSemester(sem.id, 'name', e.target.value)}
                        className={`flex-1 min-w-0 rounded-lg border px-2 py-1 text-sm outline-none transition-colors ${T.input}`} />
                      {semSGPA > 0 && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${T.badgeGr}`}>
                          SGPA: {semSGPA.toFixed(2)}
                        </span>
                      )}
                      <button onClick={() => removeSemester(sem.id)}
                        className={`p-1.5 rounded-lg shrink-0 transition-colors ${T.trashOn}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mode toggle */}
                    <div className="px-5 pt-4">
                      <div className={`flex rounded-xl p-0.5 mb-4 ${T.modeBar}`}>
                        {['direct','courses'].map(m => (
                          <button key={m} onClick={() => updateSemester(sem.id, 'mode', m)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              sem.mode === m ? T.modeOn : T.modeOff
                            }`}>
                            {m === 'direct' ? 'Direct SGPA' : 'Add Courses'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 pb-5">

                      {/* Direct SGPA mode */}
                      {sem.mode === 'direct' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-xs font-medium mb-1 ${T.label}`}>SGPA (0 – 4.00)</label>
                            <input type="number" value={sem.sgpa} placeholder="e.g., 3.75"
                              min="0" max="4" step="0.01"
                              onChange={e => updateSemester(sem.id, 'sgpa', e.target.value)}
                              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${T.input}`} />
                          </div>
                          <div>
                            <label className={`block text-xs font-medium mb-1 ${T.label}`}>Total Credits</label>
                            <input type="number" value={sem.totalCredits} placeholder="e.g., 18"
                              min="0" max="100"
                              onChange={e => updateSemester(sem.id, 'totalCredits', e.target.value)}
                              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${T.input}`} />
                          </div>
                        </div>
                      )}

                      {/* Add Courses mode */}
                      {sem.mode === 'courses' && (
                        <div className="space-y-3">
                          <button onClick={() => updateSemester(sem.id, 'expanded', !sem.expanded)}
                            className={`flex items-center gap-1.5 text-xs font-medium ${d?'text-indigo-400':'text-indigo-500'}`}>
                            {sem.expanded
                              ? <><ChevronUp className="w-3 h-3" />Hide Courses</>
                              : <><ChevronDown className="w-3 h-3" />Show Courses ({sem.courses.length})</>
                            }
                          </button>

                          {sem.expanded !== false && sem.courses.map((c, ci) => (
                            <div key={c.id} className={`rounded-xl p-3 border ${T.inner}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-semibold ${T.textMut}`}>Course {ci + 1}</span>
                                <button onClick={() => removeSemCourse(sem.id, c.id)}
                                  disabled={sem.courses.length === 1}
                                  className={`p-1 rounded transition-colors ${sem.courses.length===1 ? T.trashOff : T.trashOn}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <label className={`block text-xs font-medium mb-1 ${T.label}`}>Course Name</label>
                                  <input type="text" value={c.name} placeholder="e.g., Calculus"
                                    onChange={e => updateSemCourse(sem.id, c.id, 'name', e.target.value)}
                                    className={`w-full rounded-lg border px-2 py-1.5 text-xs outline-none ${T.input}`} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${T.label}`}>Credit Hours</label>
                                    <input type="number" value={c.credit} placeholder="3"
                                      min="0" max="20" step="0.5"
                                      onChange={e => updateSemCourse(sem.id, c.id, 'credit', e.target.value)}
                                      className={`w-full rounded-lg border px-2 py-1.5 text-xs outline-none ${T.input}`} />
                                  </div>
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${T.label}`}>Grade</label>
                                    <select value={c.grade}
                                      onChange={e => updateSemCourse(sem.id, c.id, 'grade', e.target.value)}
                                      className={`w-full rounded-lg border px-2 py-1.5 text-xs outline-none ${T.select}`}>
                                      <option value="">Select</option>
                                      {Object.entries(gradePoints).map(([g,p]) => (
                                        <option key={g} value={g}>{g} ({p.toFixed(2)})</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button onClick={() => addSemCourse(sem.id)}
                            className={`w-full py-2 rounded-xl border border-dashed text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${T.addIn}`}>
                            <Plus className="w-3 h-3" /> Add Course
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <button onClick={addSemester}
                className={`w-full py-3 rounded-2xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors ${T.addPu}`}>
                <Plus className="w-4 h-4" /> Add Previous Semester
              </button>
            </div>
          )}

          {/* ── Grade Reference ── */}
          {tab === 'reference' && (
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${T.card}`}>
              <div className={`px-5 py-4 border-b ${T.divider}`}>
                <h2 className={`text-base font-semibold ${T.text}`}>UGC Uniform Grading System</h2>
                <p className={`text-sm mt-0.5 ${T.textSec}`}>Bangladesh University Grants Commission</p>
              </div>
              <div className={`divide-y ${T.divider}`}>
                {Object.entries(gradePoints).map(([grade, pts]) => (
                  <div key={grade} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${gradeColors[grade]}`}>
                        {grade}
                      </span>
                      <span className={`text-sm ${T.textSec}`}>{gradeLabels[grade]}</span>
                    </div>
                    <span className={`text-sm font-semibold ${T.statVal}`}>{pts.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>{/* end tab content */}

        <p className={`text-center text-xs mt-8 ${T.textMut}`}>
          CGPA Calculator Bangladesh · UGC Grading System
        </p>
      </div>
    </div>
  );
}