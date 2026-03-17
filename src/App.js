import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft, FileText, Users } from 'lucide-react';

// ─── GPA Scale ───────────────────────────────────────────────────────────────
const gpaScale = [
  { min:80, max:100, letter:'A+', points:5.00, en:'Outstanding',   bn:'অসাধারণ'    },
  { min:70, max:79,  letter:'A',  points:4.00, en:'Accomplished',  bn:'দক্ষ'        },
  { min:60, max:69,  letter:'A-', points:3.50, en:'Advanced',      bn:'উন্নত'       },
  { min:50, max:59,  letter:'B',  points:3.00, en:'Active',        bn:'সক্রিয়'      },
  { min:40, max:49,  letter:'C',  points:2.00, en:'Investigative', bn:'অনুসন্ধানী'  },
  { min:33, max:39,  letter:'D',  points:1.00, en:'Developing',    bn:'উন্নয়নশীল'  },
  { min:0,  max:32,  letter:'F',  points:0.00, en:'Foundational',  bn:'ভিত্তিমূলক' },
];

const getGradeFromPct = (pct) => {
  if (pct === null || pct === undefined) return null;
  const p = parseFloat(pct);
  if (isNaN(p) || p < 0) return null;
  // Use floor to handle decimals: 79.33% → 79 → A (70-79)
  const floored = Math.floor(p);
  return gpaScale.find(g => floored >= g.min && floored <= g.max) || gpaScale[gpaScale.length - 1];
};

// Get percentage from subject (0-100 scale)
const getSubjectPct = (s) => {
  if (s.type === 'single') {
    if (s.marks === '' || s.marks === undefined) return null;
    const m = parseFloat(s.marks), max = parseFloat(s.maxMarks) || 100;
    if (isNaN(m) || m < 0 || m > max || max <= 0) return null;
    return (m / max) * 100;
  }
  // double: both papers required
  if (s.marks1 === '' || s.marks2 === '' || s.marks1 === undefined || s.marks2 === undefined) return null;
  const m1 = parseFloat(s.marks1), m2 = parseFloat(s.marks2);
  const max1 = parseFloat(s.paper1Max) || 100, max2 = parseFloat(s.paper2Max) || 100;
  if (isNaN(m1) || m1 < 0 || m1 > max1) return null;
  if (isNaN(m2) || m2 < 0 || m2 > max2) return null;
  if (max1 <= 0 || max2 <= 0) return null;
  // Combined: total obtained / total max * 100
  return ((m1 + m2) / (max1 + max2)) * 100;
};

const calcStudentGPA = (subjects) => {
  const valid = subjects.filter(s => getSubjectPct(s) !== null);
  if (!valid.length) return 0;
  return valid.reduce((sum, s) => {
    const g = getGradeFromPct(getSubjectPct(s));
    return sum + (g ? g.points : 0);
  }, 0) / valid.length;
};

// ─── CGPA Grade system ────────────────────────────────────────────────────────
const cgpaGP = {
  'A+':4.00,'A':3.75,'A-':3.50,'B+':3.25,'B':3.00,'B-':2.75,
  'C+':2.50,'C':2.25,'C-':2.00,'D+':1.75,'D':1.50,'F':0.00,
};
const cgpaLabel = {
  'A+':'Outstanding','A':'Excellent','A-':'Very Good','B+':'Good',
  'B':'Satisfactory','B-':'Above Average','C+':'Average','C':'Below Average',
  'C-':'Marginal','D+':'Poor','D':'Very Poor','F':'Fail',
};
const cgpaColors = {
  'A+':'bg-emerald-100 text-emerald-800','A':'bg-emerald-100 text-emerald-700',
  'A-':'bg-teal-100 text-teal-700','B+':'bg-blue-100 text-blue-700',
  'B':'bg-blue-100 text-blue-600','B-':'bg-indigo-100 text-indigo-600',
  'C+':'bg-yellow-100 text-yellow-700','C':'bg-yellow-100 text-yellow-600',
  'C-':'bg-orange-100 text-orange-600','D+':'bg-red-100 text-red-600',
  'D':'bg-red-100 text-red-500','F':'bg-gray-100 text-gray-500',
};

// ─── Translations ─────────────────────────────────────────────────────────────
const TX = {
  en: {
    appTitle:'Grade Calculator', appSub:'Bangladesh Grading System',
    chooseQ:'Which calculator would you like?', chooseSub:'Choose your calculator type',
    gpaTitle:'GPA Calculator', gpaSub:'Secondary & Higher Secondary · 5.00 Scale',
    gpaD1:'Secondary & Higher Secondary', gpaD2:'Subject marks → GPA', gpaD3:'Student list + PDF export',
    cgpaTitle:'CGPA Calculator', cgpaSub:'University · UGC System · 4.00 Scale',
    cgpaD1:'University · UGC System', cgpaD2:'Course grades → CGPA', cgpaD3:'Current + Previous semesters',
    instInfo:'Institution Info', schoolL:'School / College Name', schoolPh:'e.g., Dhaka High School',
    classL:'Class Name', classPh:'e.g., Class 9 – Science',
    studentInfo:'Student Details', nameL:'Student Name', namePh:'e.g., Rahim',
    rollL:'Roll', rollPh:'e.g., 01',
    subjectSec:'Subjects & Marks', addSubject:'Add Subject',
    subjectName:'Subject Name', maxL:'Max Marks', marksL:'Marks Obtained',
    paper1:'1st Paper', paper2:'2nd Paper', totalMarks:'Total Marks',
    singleType:'Single Paper', doubleType:'Double Paper',
    addBtn:'Add Student to List',
    tabAdd:'Add Student', tabList:'Student List', tabRef:'Grade Table',
    noStudents:'No students added yet.', noStudentsSub:'Go to "Add Student" to begin.',
    studentsL:'Students', avgGPA:'Class Avg GPA', currGPA:'Student GPA',
    exportPDF:'Export as PDF',
    pdfNote:'📱 Mobile: tap "Save as PDF" in the print dialog',
    refTitle:'New Curriculum Grading System', refSub:'Secondary & Higher Secondary · 5.00 Scale',
    marksH:'Marks', gradeH:'Grade', gpaH:'GPA', catH:'Category',
    doubleNote:'Double paper: total marks from both papers → percentage → grade',
    pdfSheetTitle:'GPA Result Sheet',
    pdfSheetSub:'New Curriculum Grading System – Secondary & Higher Secondary',
    rollCol:'Roll', nameCol:'Student Name', gpaCol:'GPA', gradeCol:'Grade', catCol:'Category',
    pdfFooter:'Generated by Grade Calculator Bangladesh',
  },
  bn: {
    appTitle:'গ্রেড ক্যালকুলেটর', appSub:'বাংলাদেশ গ্রেডিং সিস্টেম',
    chooseQ:'কোন ক্যালকুলেটর ব্যবহার করতে চান?', chooseSub:'আপনার ক্যালকুলেটর বেছে নিন',
    gpaTitle:'জিপিএ ক্যালকুলেটর', gpaSub:'মাধ্যমিক ও উচ্চ মাধ্যমিক · ৫.০০ স্কেল',
    gpaD1:'মাধ্যমিক ও উচ্চ মাধ্যমিক', gpaD2:'বিষয়ের নম্বর → জিপিএ', gpaD3:'তালিকা + পিডিএফ',
    cgpaTitle:'সিজিপিএ ক্যালকুলেটর', cgpaSub:'বিশ্ববিদ্যালয় · ইউজিসি · ৪.০০ স্কেল',
    cgpaD1:'বিশ্ববিদ্যালয় · ইউজিসি সিস্টেম', cgpaD2:'কোর্স গ্রেড → সিজিপিএ', cgpaD3:'চলতি + পূর্ববর্তী সেমিস্টার',
    instInfo:'প্রতিষ্ঠানের তথ্য', schoolL:'বিদ্যালয় / কলেজের নাম', schoolPh:'যেমন: ঢাকা হাই স্কুল',
    classL:'শ্রেণির নাম', classPh:'যেমন: নবম শ্রেণি – বিজ্ঞান',
    studentInfo:'শিক্ষার্থীর তথ্য', nameL:'নাম', namePh:'যেমন: রহিম',
    rollL:'রোল', rollPh:'যেমন: ০১',
    subjectSec:'বিষয় ও নম্বর', addSubject:'বিষয় যোগ করুন',
    subjectName:'বিষয়ের নাম', maxL:'সর্বোচ্চ নম্বর', marksL:'প্রাপ্ত নম্বর',
    paper1:'১ম পত্র', paper2:'২য় পত্র', totalMarks:'মোট নম্বর',
    singleType:'একক পত্র', doubleType:'দ্বৈত পত্র',
    addBtn:'তালিকায় যোগ করুন',
    tabAdd:'শিক্ষার্থী যোগ', tabList:'তালিকা', tabRef:'গ্রেড টেবিল',
    noStudents:'কোনো শিক্ষার্থী যোগ হয়নি।', noStudentsSub:'"শিক্ষার্থী যোগ" ট্যাবে যান।',
    studentsL:'শিক্ষার্থী', avgGPA:'শ্রেণি গড় জিপিএ', currGPA:'শিক্ষার্থীর জিপিএ',
    exportPDF:'পিডিএফ তৈরি করুন',
    pdfNote:'📱 মোবাইলে: প্রিন্ট ডায়ালগ থেকে "Save as PDF" বেছে নিন',
    refTitle:'নতুন কারিকুলাম গ্রেডিং সিস্টেম', refSub:'মাধ্যমিক ও উচ্চ মাধ্যমিক · ৫.০০ স্কেল',
    marksH:'নম্বর', gradeH:'গ্রেড', gpaH:'জিপিএ', catH:'ক্যাটাগরি',
    doubleNote:'দ্বৈত পত্র: উভয় পত্রের মোট নম্বর → শতকরা → গ্রেড',
    pdfSheetTitle:'জিপিএ ফলাফল তালিকা',
    pdfSheetSub:'নতুন কারিকুলাম গ্রেডিং সিস্টেম – মাধ্যমিক ও উচ্চ মাধ্যমিক',
    rollCol:'রোল', nameCol:'নাম', gpaCol:'জিপিএ', gradeCol:'গ্রেড', catCol:'ক্যাটাগরি',
    pdfFooter:'গ্রেড ক্যালকুলেটর বাংলাদেশ কর্তৃক তৈরি',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => String(Date.now() + (++_id));

const newSubject = () => ({
  id: uid(), name: '', type: 'single',
  maxMarks: '100', marks: '',
  paper1Max: '100', paper2Max: '100', marks1: '', marks2: '',
});
const newCourse   = () => ({ id: uid(), name: '', credit: '', grade: '' });
const newSemester = () => ({
  id: uid(), name: '', sgpa: '', totalCredits: '',
  mode: 'direct', courses: [newCourse()], expanded: true,
});

const SYMBOLS = ['+', '−', '×', '÷', '='];

// ─── PDF Export ───────────────────────────────────────────────────────────────
const exportPDF = (schoolName, className, studentList, lang) => {
  if (!studentList.length) return;
  const t  = TX[lang];
  const subs = studentList[0]?.subjects || [];

  const subHeaders = subs.map(s => {
    if (s.type === 'double') {
      const tm = (parseFloat(s.paper1Max)||100) + (parseFloat(s.paper2Max)||100);
      return `<th>${s.name||t.subjectName}<br/><small>(/${tm})</small></th>`;
    }
    return `<th>${s.name||t.subjectName}<br/><small>(/${s.maxMarks||100})</small></th>`;
  }).join('');

  const rows = studentList.map((st, i) => {
    const gpa = calcStudentGPA(st.subjects);
    const gi  = gpaScale.find(g => gpa >= g.points - 0.001) || gpaScale[gpaScale.length-1];
    const cat = lang === 'bn' ? gi.bn : gi.en;

    const subCells = st.subjects.map(s => {
      const pct = getSubjectPct(s);
      const g   = getGradeFromPct(pct);
      if (s.type === 'double') {
        const tot    = (parseFloat(s.marks1)||0) + (parseFloat(s.marks2)||0);
        const totMax = (parseFloat(s.paper1Max)||100) + (parseFloat(s.paper2Max)||100);
        const valid  = pct !== null;
        return `<td>${valid?`${s.marks1}+${s.marks2}`:'—'}<br/><b>${valid?`${tot}/${totMax}`:'—'}</b><br/><small>${valid?pct.toFixed(0)+'% '+g.letter:'—'}</small></td>`;
      }
      const max = s.maxMarks||100;
      return `<td>${s.marks!==''?s.marks:'—'}/${max}<br/><small>${pct!==null?pct.toFixed(0)+'% '+(g?g.letter:''):'—'}</small></td>`;
    }).join('');

    return `<tr style="background:${i%2===0?'#fff':'#f5f5ff'}">
      <td>${st.roll||i+1}</td>
      <td style="text-align:left;font-weight:500">${st.name}</td>
      ${subCells}
      <td style="font-weight:700;color:#4F46E5">${gpa.toFixed(2)}</td>
      <td><b>${gi.letter}</b></td>
      <td style="font-size:11px">${cat}</td>
    </tr>`;
  }).join('');

  // Calculate summary stats
  const totalStudents = studentList.length;
  const passStudents  = studentList.filter(st => {
    const g = gpaScale.find(gg => calcStudentGPA(st.subjects) >= gg.points - 0.001) || gpaScale[gpaScale.length-1];
    return g.letter !== 'F';
  }).length;
  const failStudents  = totalStudents - passStudents;
  const passRate      = totalStudents > 0 ? ((passStudents/totalStudents)*100).toFixed(1) : '0.0';
  const failRate      = totalStudents > 0 ? ((failStudents/totalStudents)*100).toFixed(1) : '0.0';
  const classAvg      = totalStudents > 0 ? (studentList.reduce((s,st)=>s+calcStudentGPA(st.subjects),0)/totalStudents).toFixed(2) : '0.00';

  const summaryLabels = lang === 'bn'
    ? { total:'মোট শিক্ষার্থী', pass:'উত্তীর্ণ', fail:'অনুত্তীর্ণ', passRate:'পাসের হার', failRate:'ফেলের হার', avg:'শ্রেণি গড় জিপিএ' }
    : { total:'Total Students', pass:'Passed', fail:'Failed', passRate:'Pass Rate', failRate:'Fail Rate', avg:'Class Avg GPA' };

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to export PDF'); return; }
  win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<title>${t.pdfSheetTitle}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,'Noto Sans Bengali',sans-serif;padding:22px;color:#111;font-size:13px}
  h1{text-align:center;font-size:20px;margin-bottom:3px}
  h2{text-align:center;font-size:14px;font-weight:400;color:#555;margin-bottom:2px}
  h3{text-align:center;font-size:12px;font-weight:400;color:#777;margin-bottom:14px}
  .summary{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
  .stat-box{flex:1;min-width:90px;border:1px solid #ddd;border-radius:6px;padding:8px 10px;text-align:center}
  .stat-box .num{font-size:20px;font-weight:700;color:#4F46E5;display:block}
  .stat-box .lbl{font-size:10px;color:#666;margin-top:2px}
  .stat-box.pass .num{color:#059669}
  .stat-box.fail .num{color:#DC2626}
  .stat-box.avg .num{color:#7C3AED}
  table{width:100%;border-collapse:collapse;margin-top:4px}
  th{background:#4F46E5;color:#fff;padding:7px 5px;border:1px solid #3730a3;font-size:11px;text-align:center}
  td{padding:6px 5px;border:1px solid #ddd;text-align:center;font-size:12px;vertical-align:middle}
  td small{font-size:10px;color:#666;display:block}
  .footer{margin-top:14px;text-align:center;font-size:10px;color:#aaa}
  @media print{body{padding:8px}}
</style>
</head><body>
<h1>${schoolName||'School / College'}</h1>
<h2>${className||''}</h2>
<h3>${t.pdfSheetSub}</h3>
<div class="summary">
  <div class="stat-box"><span class="num">${totalStudents}</span><div class="lbl">${summaryLabels.total}</div></div>
  <div class="stat-box pass"><span class="num">${passStudents}</span><div class="lbl">${summaryLabels.pass} (${passRate}%)</div></div>
  <div class="stat-box fail"><span class="num">${failStudents}</span><div class="lbl">${summaryLabels.fail} (${failRate}%)</div></div>
  <div class="stat-box avg"><span class="num">${classAvg}</span><div class="lbl">${summaryLabels.avg}</div></div>
</div>
<table><thead><tr>
  <th>${t.rollCol}</th><th>${t.nameCol}</th>${subHeaders}
  <th>${t.gpaCol}</th><th>${t.gradeCol}</th><th>${t.catCol}</th>
</tr></thead><tbody>${rows}</tbody></table>
<div class="footer">${t.pdfFooter} · ${new Date().toLocaleDateString('en-BD')}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`);
  win.document.close();
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const GPAIcon = ({ size=30, color='#4f46e5' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="3"  y="20" width="5" height="9" rx="1" fill={color} opacity="0.3"/>
    <rect x="10" y="14" width="5" height="15" rx="1" fill={color} opacity="0.5"/>
    <rect x="17" y="8"  width="5" height="21" rx="1" fill={color} opacity="0.7"/>
    <rect x="24" y="3"  width="5" height="26" rx="1" fill={color}/>
    <polyline points="5.5,20 12.5,14 19.5,8 26.5,3" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <circle cx="5.5"  cy="20" r="2" fill={color}/>
    <circle cx="12.5" cy="14" r="2" fill={color}/>
    <circle cx="19.5" cy="8"  r="2" fill={color}/>
    <circle cx="26.5" cy="3"  r="2" fill={color}/>
  </svg>
);
const CGPAIcon = ({ size=30, color='#9333ea' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M4 14 L16 5 L28 14 L28 29 L4 29 Z" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.08"/>
    <rect x="7"  y="20" width="5" height="9" rx="0.5" fill={color} opacity="0.4"/>
    <rect x="14" y="17" width="4" height="12" rx="0.5" fill={color} opacity="0.6"/>
    <rect x="20" y="20" width="5" height="9" rx="0.5" fill={color} opacity="0.4"/>
    <line x1="4" y1="14" x2="28" y2="14" stroke={color} strokeWidth="1.3"/>
    <circle cx="25" cy="8" r="5.5" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.2"/>
    <text x="25" y="10.5" textAnchor="middle" fontSize="5.5" fill={color} fontWeight="bold">4.0</text>
  </svg>
);

// ─── Theme helper ─────────────────────────────────────────────────────────────
const makeT = (d) => ({
  page:     d ? 'bg-gray-950'   : 'bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50',
  card:     d ? 'bg-gray-900 border-gray-800'  : 'bg-white border-gray-100',
  inner:    d ? 'bg-gray-800 border-gray-700'  : 'bg-gray-50 border-gray-100',
  innerDbl: d ? 'bg-gray-750 border-gray-600'  : 'bg-indigo-50/50 border-indigo-100',
  text:     d ? 'text-gray-100' : 'text-gray-800',
  textSec:  d ? 'text-gray-400' : 'text-gray-500',
  textMut:  d ? 'text-gray-600' : 'text-gray-400',
  label:    d ? 'text-gray-300' : 'text-gray-600',
  divider:  d ? 'divide-gray-800 border-gray-800' : 'divide-gray-100 border-gray-100',
  input:    d ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
             : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400',
  inputSm:  d ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
             : 'bg-white border-gray-300 text-gray-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400',
  select:   d ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-indigo-500'
             : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-indigo-400',
  tabBar:   d ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-transparent',
  tabOn:    'bg-indigo-600 text-white shadow-md',
  tabOff:   d ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
  modeBar:  d ? 'bg-gray-800' : 'bg-gray-100',
  modeOn:   d ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-sm',
  modeOff:  d ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700',
  typeBar:  d ? 'bg-gray-700' : 'bg-gray-200',
  typeOnS:  d ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white',
  typeOnD:  d ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white',
  typeOff:  d ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700',
  statCard: d ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100',
  statFinal:d ? 'bg-gradient-to-br from-indigo-950 to-purple-950 border-indigo-900' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100',
  statVal:  d ? 'text-indigo-400' : 'text-indigo-600',
  statFV:   d ? 'text-indigo-300' : 'text-indigo-700',
  badgeIn:  d ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-600',
  badgePu:  d ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-600',
  badgeGr:  d ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-50 text-emerald-600',
  badgeResult: d ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
  addIn:    d ? 'border-indigo-700 text-indigo-400 hover:border-indigo-500 hover:bg-indigo-900/20' : 'border-indigo-400 text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50',
  addPu:    d ? 'border-purple-700 text-purple-400 hover:border-purple-500 hover:bg-purple-900/20' : 'border-purple-400 text-purple-600 hover:border-purple-600 hover:bg-purple-50',
  themeBtn: d ? 'bg-indigo-900/50 border border-indigo-800 hover:bg-indigo-800/70' : 'bg-amber-50 border border-amber-200 hover:bg-amber-100',
  langBtn:  d ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
  langOn:   d ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white',
  langOff:  d ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700',
  stickyBg: d ? 'bg-gray-950' : 'bg-gradient-to-b from-slate-50 via-indigo-50/90 to-transparent',
  trashOn:  d ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50',
  trashOff: d ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed',
});

const SunSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#a5b4fc" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen,  setScreen]  = useState('home');
  const [dark,    setDark]    = useState(() => { try { return localStorage.getItem('grade-theme') === 'dark'; } catch { return false; } });
  const [lang,    setLang]    = useState(() => { try { return localStorage.getItem('grade-lang') || 'bn'; } catch { return 'bn'; } });
  const [animDir, setAnimDir] = useState(null);

  useEffect(() => { try { localStorage.setItem('grade-theme', dark ? 'dark' : 'light'); } catch {} }, [dark]);
  useEffect(() => { try { localStorage.setItem('grade-lang', lang); } catch {} }, [lang]);

  const toggleTheme = () => {
    if (animDir) return;
    setAnimDir(dark ? 'to-light' : 'to-dark');
    setTimeout(() => { setDark(p => !p); setAnimDir(null); }, 560);
  };

  const TH  = makeT(dark);
  const txt = TX[lang];

  // Theme + Language controls
  const Controls = ({ showLang = true }) => (
    <div className="flex items-center gap-2 shrink-0">
      {showLang && (
        <div className={`flex rounded-xl border p-0.5 text-xs font-semibold ${TH.langBtn}`}>
          {['en', 'bn'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 ${lang === l ? TH.langOn : TH.langOff}`}>
              {l === 'en' ? 'EN' : 'বাং'}
            </button>
          ))}
        </div>
      )}
      <button onClick={toggleTheme}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${TH.themeBtn}`}>
        <div style={{ width: 22, height: 22, position: 'relative', overflow: 'hidden' }}>
          <div className={animDir === 'to-dark' ? 'icon-set' : animDir === 'to-light' ? 'icon-rise' : ''}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: animDir ? undefined : (dark ? 'translateY(120%)' : 'translateY(0%)'),
              opacity: animDir ? undefined : (dark ? 0 : 1) }}>
            <SunSVG />
          </div>
          <div className={animDir === 'to-dark' ? 'icon-rise' : animDir === 'to-light' ? 'icon-set' : ''}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: animDir ? undefined : (dark ? 'translateY(0%)' : 'translateY(120%)'),
              opacity: animDir ? undefined : (dark ? 1 : 0) }}>
            <MoonSVG />
          </div>
        </div>
      </button>
    </div>
  );

  const Logo = ({ title, subtitle, showBack = false, showLang = true }) => (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showBack && (
          <button onClick={() => setScreen('home')}
            className={`p-2 rounded-xl shrink-0 transition-colors ${dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className={`rounded-2xl overflow-hidden shrink-0 ${dark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`} style={{ width: 44, height: 44 }}>
          <img src="/logo192.png" alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }} />
        </div>
        <div className="min-w-0">
          <h1 className={`text-lg sm:text-xl font-bold tracking-tight leading-tight truncate ${TH.text}`}>{title}</h1>
          <p className={`text-xs truncate ${TH.textSec}`}>{subtitle}</p>
        </div>
      </div>
      <Controls showLang={showLang} />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 ${TH.page}`}>
      <style>{`
        @keyframes rippleWave { 0%{transform:translate(-50%,-50%) scale(0.2);opacity:0.85} 100%{transform:translate(-50%,-50%) scale(2.6);opacity:0} }
        @keyframes iconSet  { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(120%);opacity:0} }
        @keyframes iconRise { 0%{transform:translateY(120%);opacity:0} 100%{transform:translateY(0);opacity:1} }
        .icon-set  { animation: iconSet  0.52s cubic-bezier(.4,0,1,1) forwards; }
        .icon-rise { animation: iconRise 0.52s cubic-bezier(0,0,.6,1) .06s forwards; }
      `}</style>
      {screen === 'home' && <HomeScreen dark={dark} TH={TH} txt={txt} Logo={Logo} onNav={setScreen} />}
      {screen === 'gpa'  && <GPACalculator dark={dark} TH={TH} txt={txt} lang={lang} Logo={Logo} />}
      {screen === 'cgpa' && <CGPACalculator dark={dark} TH={TH} Logo={Logo} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════════════════════════════════════
function HomeScreen({ dark: d, TH, txt, Logo, onNav }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <Logo title={txt.appTitle} subtitle={txt.appSub} />
      <div className="text-center mb-8">
        <p className={`text-base sm:text-lg font-semibold ${TH.text}`}>{txt.chooseQ}</p>
        <p className={`text-sm mt-1 ${TH.textSec}`}>{txt.chooseSub}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[
          {
            key: 'gpa', icon: <GPAIcon size={30} color={d ? '#818cf8' : '#4f46e5'} />,
            title: txt.gpaTitle, lines: [txt.gpaD1, txt.gpaD2, txt.gpaD3], badge: '5.00 Scale',
            bg: d ? 'bg-indigo-900/60 group-hover:bg-indigo-800' : 'bg-indigo-100 group-hover:bg-indigo-200',
            border: d ? 'hover:border-indigo-500' : 'hover:border-indigo-300 hover:shadow-indigo-100',
            badgeCls: d ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-600',
          },
          {
            key: 'cgpa', icon: <CGPAIcon size={30} color={d ? '#c084fc' : '#9333ea'} />,
            title: txt.cgpaTitle, lines: [txt.cgpaD1, txt.cgpaD2, txt.cgpaD3], badge: '4.00 Scale',
            bg: d ? 'bg-purple-900/60 group-hover:bg-purple-800' : 'bg-purple-100 group-hover:bg-purple-200',
            border: d ? 'hover:border-purple-500' : 'hover:border-purple-300 hover:shadow-purple-100',
            badgeCls: d ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-600',
          },
        ].map(c => (
          <button key={c.key} onClick={() => onNav(c.key)}
            className={`group rounded-3xl border-2 p-6 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${d ? `bg-gray-900 border-gray-700 ${c.border}` : `bg-white border-gray-100 ${c.border}`}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${c.bg}`}>
              {c.icon}
            </div>
            <h2 className={`text-xl font-bold mb-2 ${TH.text}`}>{c.title}</h2>
            <p className={`text-sm leading-relaxed ${TH.textSec}`}>{c.lines.join('\n').split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</p>
            <div className={`mt-4 text-xs font-semibold px-3 py-1 rounded-full inline-block ${c.badgeCls}`}>{c.badge}</div>
          </button>
        ))}
      </div>
      <p className={`text-center text-xs mt-10 ${TH.textMut}`}>Grade Calculator Bangladesh · New Curriculum &amp; UGC System</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GPA CALCULATOR
// ══════════════════════════════════════════════════════════════════════════════
function GPACalculator({ dark: d, TH, txt, lang, Logo }) {
  const [schoolName,  setSchoolName]  = useState('');
  const [className,   setClassName]   = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [subjects,    setSubjects]    = useState([newSubject(), newSubject(), newSubject()]);
  const [studentList, setStudentList] = useState([]);
  const [activeView,  setActiveView]  = useState('form');

  const gpa       = calcStudentGPA(subjects);
  const validSubs = subjects.filter(s => getSubjectPct(s) !== null);
  const avgGPA    = studentList.length ? studentList.reduce((s, st) => s + st.gpa, 0) / studentList.length : 0;
  const gradeInfo = gpa > 0 ? (gpaScale.find(g => gpa >= g.points - 0.001) || gpaScale[gpaScale.length-1]) : null;

  const addSubject    = () => setSubjects(s => [...s, newSubject()]);
  const removeSubject = (id) => { if (subjects.length > 1) setSubjects(s => s.filter(x => x.id !== id)); };

  const updateSubject = (id, field, val) => setSubjects(s => s.map(x => {
    if (x.id !== id) return x;
    // If switching type, reset marks
    if (field === 'type') return { ...x, type: val, marks: '', marks1: '', marks2: '' };
    // Validate numeric fields
    if (['marks', 'marks1', 'marks2'].includes(field)) {
      if (val !== '') {
        const v = parseFloat(val);
        const maxKey = field === 'marks' ? 'maxMarks' : field === 'marks1' ? 'paper1Max' : 'paper2Max';
        const maxVal = parseFloat(x[maxKey]) || 100;
        if (isNaN(v) || v < 0 || v > maxVal) return x;
      }
    }
    if (['maxMarks', 'paper1Max', 'paper2Max'].includes(field)) {
      if (val !== '') {
        const v = parseFloat(val);
        if (isNaN(v) || v < 1 || v > 9999) return x;
      }
      // Reset corresponding marks when max changes
      const relatedMark = field === 'maxMarks' ? 'marks' : field === 'paper1Max' ? 'marks1' : 'marks2';
      return { ...x, [field]: val, [relatedMark]: '' };
    }
    return { ...x, [field]: val };
  }));

  const addStudent = () => {
    if (!studentName.trim() || validSubs.length === 0) return;
    setStudentList(l => [...l, {
      id: uid(), name: studentName.trim(), roll: studentRoll.trim(),
      subjects: subjects.map(s => ({ ...s })), gpa,
    }]);
    setStudentName('');
    setStudentRoll('');
    setSubjects(subjects.map(s => ({ ...s, marks: '', marks1: '', marks2: '' })));
    setActiveView('list');
  };
  const removeStudent = (id) => setStudentList(l => l.filter(s => s.id !== id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Logo title={txt.gpaTitle} subtitle={txt.gpaSub} showBack showLang />

      {/* Institution */}
      <div className={`rounded-2xl border p-4 mb-4 ${TH.card}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${TH.textMut}`}>{txt.instInfo}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${TH.label}`}>{txt.schoolL}</label>
            <input type="text" value={schoolName} placeholder={txt.schoolPh}
              onChange={e => setSchoolName(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.input}`} />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${TH.label}`}>{txt.classL}</label>
            <input type="text" value={className} placeholder={txt.classPh}
              onChange={e => setClassName(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.input}`} />
          </div>
        </div>
      </div>

      {/* Sticky block */}
      <div className={`sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 ${TH.stickyBg}`}>
        {activeView === 'form' && gpa > 0 && gradeInfo && (
          <div className={`rounded-2xl p-3 border shadow-sm mb-3 flex items-center justify-between ${TH.statCard}`}>
            <div>
              <p className={`text-xs font-medium uppercase tracking-wider ${TH.textMut}`}>{txt.currGPA}</p>
              <p className={`text-3xl font-bold mt-0.5 ${TH.statVal}`}>{gpa.toFixed(2)}</p>
            </div>
            <div className={`text-center px-4 py-2 rounded-xl ${d ? 'bg-indigo-900/60' : 'bg-indigo-50'}`}>
              <p className={`text-xl font-bold ${d ? 'text-indigo-300' : 'text-indigo-700'}`}>{gradeInfo.letter}</p>
              <p className={`text-xs ${TH.textMut}`}>{lang === 'bn' ? gradeInfo.bn : gradeInfo.en}</p>
            </div>
          </div>
        )}
        {activeView === 'list' && studentList.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`rounded-2xl p-3 border shadow-sm ${TH.statCard}`}>
              <p className={`text-xs font-medium uppercase tracking-wider ${TH.textMut}`}>{txt.studentsL}</p>
              <p className={`text-3xl font-bold mt-0.5 ${TH.statVal}`}>{studentList.length}</p>
            </div>
            <div className={`rounded-2xl p-3 border shadow-sm ${TH.statFinal}`}>
              <p className={`text-xs font-medium uppercase tracking-wider ${TH.textMut}`}>{txt.avgGPA}</p>
              <p className={`text-3xl font-bold mt-0.5 ${TH.statFV}`}>{avgGPA.toFixed(2)}</p>
            </div>
          </div>
        )}
        <div className={`flex rounded-2xl p-1 border ${TH.tabBar}`}>
          {[
            { key: 'form',      label: txt.tabAdd },
            { key: 'list',      label: `${txt.tabList}${studentList.length > 0 ? ' (' + studentList.length + ')' : ''}` },
            { key: 'reference', label: txt.tabRef },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveView(t.key)}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-medium transition-all duration-200 ${activeView === t.key ? TH.tabOn : TH.tabOff}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-4">

        {/* ── Add Student Form ── */}
        {activeView === 'form' && (<>
          {/* Student info */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${TH.card}`}>
            <div className={`px-5 py-3 border-b ${TH.divider}`}>
              <p className={`text-sm font-semibold ${TH.text}`}>{txt.studentInfo}</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${TH.label}`}>{txt.nameL}</label>
                <input type="text" value={studentName} placeholder={txt.namePh}
                  onChange={e => setStudentName(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.input}`} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${TH.label}`}>{txt.rollL}</label>
                <input type="text" value={studentRoll} placeholder={txt.rollPh}
                  onChange={e => setStudentRoll(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.input}`} />
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${TH.card}`}>
            <div className={`px-4 py-3 border-b ${TH.divider} flex items-center justify-between`}>
              <p className={`text-sm font-semibold ${TH.text}`}>{txt.subjectSec}</p>
              <button onClick={addSubject}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${TH.badgeIn} cursor-pointer`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                {txt.addSubject}
              </button>
            </div>
            <div className="p-4 space-y-3">
              {subjects.map((sub, idx) => {
                const pct   = getSubjectPct(sub);
                const grade = getGradeFromPct(pct);
                const isDouble = sub.type === 'double';
                return (
                  <div key={sub.id} className={`rounded-xl border overflow-hidden ${isDouble ? (d ? 'border-purple-800/60' : 'border-purple-200') : TH.inner.split(' ')[1]}`}
                    style={{ background: isDouble ? (d ? 'rgba(88,28,135,0.08)' : 'rgba(245,243,255,0.8)') : undefined }}>

                    {/* Subject header row */}
                    <div className={`px-3 pt-3 pb-2 flex items-center justify-between gap-2 flex-wrap`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isDouble ? (d?'bg-purple-900/60 text-purple-300':'bg-purple-100 text-purple-700') : TH.badgeIn}`}>
                          {idx + 1}
                        </span>
                        {/* Type toggle inside card */}
                        <div className={`flex rounded-lg p-0.5 text-xs font-medium ${TH.typeBar}`}>
                          <button onClick={() => updateSubject(sub.id, 'type', 'single')}
                            className={`px-2.5 py-1 rounded-md transition-all ${sub.type === 'single' ? TH.typeOnS : TH.typeOff}`}>
                            {txt.singleType}
                          </button>
                          <button onClick={() => updateSubject(sub.id, 'type', 'double')}
                            className={`px-2.5 py-1 rounded-md transition-all ${sub.type === 'double' ? TH.typeOnD : TH.typeOff}`}>
                            {txt.doubleType}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {grade && pct !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${TH.badgeResult}`}>
                            {grade.letter} {grade.points.toFixed(2)} ({pct.toFixed(0)}%)
                          </span>
                        )}
                        <button onClick={() => removeSubject(sub.id)} disabled={subjects.length === 1}
                          className={`p-1 rounded transition-colors ${subjects.length === 1 ? TH.trashOff : TH.trashOn}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subject name */}
                    <div className="px-3 pb-2">
                      <input type="text" value={sub.name}
                        placeholder={isDouble ? (lang === 'bn' ? 'যেমন: বাংলা' : 'e.g., Bangla') : (lang === 'bn' ? 'যেমন: গণিত' : 'e.g., Math')}
                        onChange={e => updateSubject(sub.id, 'name', e.target.value)}
                        className={`w-full rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors ${TH.input}`} />
                    </div>

                    {/* Single paper inputs */}
                    {!isDouble && (
                      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${TH.label}`}>{txt.maxL}</label>
                          <input type="number" value={sub.maxMarks} min="1" max="9999" step="5"
                            onChange={e => updateSubject(sub.id, 'maxMarks', e.target.value)}
                            className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none ${TH.inputSm}`} />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${TH.label}`}>{txt.marksL}</label>
                          <input type="number" value={sub.marks} placeholder="0"
                            min="0" max={sub.maxMarks || 100} step="0.5"
                            onChange={e => updateSubject(sub.id, 'marks', e.target.value)}
                            className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none ${TH.input}`} />
                        </div>
                      </div>
                    )}

                    {/* Double paper inputs */}
                    {isDouble && (
                      <div className="px-3 pb-3 space-y-2">
                        {[
                          { label: txt.paper1, maxField: 'paper1Max', marksField: 'marks1', maxVal: sub.paper1Max, marksVal: sub.marks1 },
                          { label: txt.paper2, maxField: 'paper2Max', marksField: 'marks2', maxVal: sub.paper2Max, marksVal: sub.marks2 },
                        ].map((p, pi) => (
                          <div key={pi} className={`rounded-lg p-2.5 ${d ? 'bg-purple-950/40' : 'bg-purple-50/60'}`}>
                            <p className={`text-xs font-semibold mb-2 ${d ? 'text-purple-300' : 'text-purple-700'}`}>{p.label}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${TH.label}`}>{txt.maxL}</label>
                                <input type="number" value={p.maxVal} min="1" max="9999" step="5"
                                  onChange={e => updateSubject(sub.id, p.maxField, e.target.value)}
                                  className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none ${TH.inputSm}`} />
                              </div>
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${TH.label}`}>{txt.marksL}</label>
                                <input type="number" value={p.marksVal} placeholder="0"
                                  min="0" max={p.maxVal || 100} step="0.5"
                                  onChange={e => updateSubject(sub.id, p.marksField, e.target.value)}
                                  className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none ${TH.input}`} />
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Combined total preview */}
                        {sub.marks1 !== '' && sub.marks2 !== '' && getSubjectPct(sub) !== null && (
                          <div className={`rounded-lg px-3 py-2 text-xs flex items-center justify-between ${d ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                            <span className={d ? 'text-purple-300' : 'text-purple-700'}>{txt.totalMarks}:</span>
                            <span className={`font-bold ${d ? 'text-purple-200' : 'text-purple-800'}`}>
                              {parseFloat(sub.marks1||0) + parseFloat(sub.marks2||0)} / {parseFloat(sub.paper1Max||100) + parseFloat(sub.paper2Max||100)}
                              {' '}({getSubjectPct(sub).toFixed(0)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={addStudent}
            disabled={!studentName.trim() || validSubs.length === 0}
            className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              studentName.trim() && validSubs.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
                : (d ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
            }`}>
            <Users className="w-4 h-4" /> {txt.addBtn}
          </button>
        </>)}

        {/* ── Student List ── */}
        {activeView === 'list' && (<>
          {studentList.length === 0 ? (
            <div className={`rounded-2xl border shadow-sm p-10 text-center ${TH.card}`}>
              <Users className={`w-10 h-10 mx-auto mb-3 ${TH.textMut}`} />
              <p className={`text-sm font-medium ${TH.textSec}`}>{txt.noStudents}</p>
              <p className={`text-xs mt-1 ${TH.textMut}`}>{txt.noStudentsSub}</p>
            </div>
          ) : (<>
            {studentList.map((st, idx) => {
              const gi = gpaScale.find(g => st.gpa >= g.points - 0.001) || gpaScale[gpaScale.length-1];
              return (
                <div key={st.id} className={`rounded-2xl border shadow-sm overflow-hidden ${TH.card}`}>
                  <div className={`px-4 py-3 border-b ${TH.divider} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${TH.badgePu}`}>{txt.rollL}: {st.roll || idx+1}</span>
                      <p className={`text-sm font-semibold ${TH.text}`}>{st.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${TH.statVal}`}>{st.gpa.toFixed(2)}</p>
                        <p className={`text-xs ${TH.textSec}`}>{gi.letter} · {lang === 'bn' ? gi.bn : gi.en}</p>
                      </div>
                      <button onClick={() => removeStudent(st.id)} className={`p-1.5 rounded-lg ${TH.trashOn}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(st.subjects.length, 4)}, 1fr)`, gap: '8px' }}>
                    {st.subjects.map(sub => {
                      const pct = getSubjectPct(sub);
                      const g   = getGradeFromPct(pct);
                      return (
                        <div key={sub.id} className={`rounded-lg p-2 text-center ${d ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <p className={`text-xs font-medium truncate ${TH.textSec}`}>{sub.name || txt.subjectName}</p>
                          {sub.type === 'double' && (
                            <p className={`text-xs ${TH.textMut}`}>{sub.marks1||'—'}+{sub.marks2||'—'}</p>
                          )}
                          <p className={`text-sm font-bold ${TH.text}`}>{pct !== null ? pct.toFixed(0) + '%' : '—'}</p>
                          {g && <p className={`text-xs font-semibold ${d ? 'text-indigo-400' : 'text-indigo-600'}`}>{g.letter}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <button onClick={() => exportPDF(schoolName, className, studentList, lang)}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg">
              <FileText className="w-4 h-4" /> {txt.exportPDF}
            </button>
            <p className={`text-center text-xs ${TH.textMut}`}>{txt.pdfNote}</p>
          </>)}
        </>)}

        {/* ── Grade Reference ── */}
        {activeView === 'reference' && (
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${TH.card}`}>
            <div className={`px-5 py-4 border-b ${TH.divider}`}>
              <h2 className={`text-base font-semibold ${TH.text}`}>{txt.refTitle}</h2>
              <p className={`text-sm mt-0.5 ${TH.textSec}`}>{txt.refSub}</p>
            </div>
            <div className={`px-5 py-2 grid grid-cols-4 gap-2 border-b ${TH.divider}`}>
              {[txt.marksH, txt.gradeH, txt.gpaH, txt.catH].map(h => (
                <p key={h} className={`text-xs font-semibold ${TH.textMut}`}>{h}</p>
              ))}
            </div>
            <div className={`divide-y ${TH.divider}`}>
              {gpaScale.map(g => (
                <div key={g.letter} className="px-5 py-3 grid grid-cols-4 gap-2 items-center">
                  <p className={`text-sm ${TH.textSec}`}>{g.min}–{g.max}%</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg w-fit ${
                    g.letter==='A+'?'bg-emerald-100 text-emerald-800':g.letter==='A'?'bg-emerald-100 text-emerald-700':
                    g.letter==='A-'?'bg-teal-100 text-teal-700':g.letter==='B'?'bg-blue-100 text-blue-700':
                    g.letter==='C'?'bg-yellow-100 text-yellow-700':g.letter==='D'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-500'
                  }`}>{g.letter}</span>
                  <p className={`text-sm font-semibold ${TH.statVal}`}>{g.points.toFixed(2)}</p>
                  <p className={`text-xs ${TH.textSec}`}>{lang === 'bn' ? g.bn : g.en}</p>
                </div>
              ))}
            </div>
            <div className={`px-5 py-3 border-t ${TH.divider}`}>
              <p className={`text-xs ${TH.textSec}`}>
                <span className={`font-semibold ${d ? 'text-purple-300' : 'text-purple-600'}`}>{txt.doubleType}:</span> {txt.doubleNote}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CGPA CALCULATOR (language toggle removed)
// ══════════════════════════════════════════════════════════════════════════════
function CGPACalculator({ dark: d, TH, Logo }) {
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
  const [ripples,    setRipples]    = useState([]);
  const lastRipple = useRef(0);

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

  const calcSGPA = (list) => {
    let pts = 0, cr = 0;
    list.forEach(c => {
      const credit = parseFloat(c.credit), gp = cgpaGP[c.grade];
      if (!isNaN(credit) && credit > 0 && gp !== undefined) { pts += credit * gp; cr += credit; }
    });
    return cr > 0 ? pts / cr : 0;
  };
  const getSemSGPA    = s => s.mode === 'direct' ? (parseFloat(s.sgpa) || 0) : calcSGPA(s.courses);
  const getSemCredits = s => s.mode === 'direct'
    ? (parseFloat(s.totalCredits) || 0)
    : s.courses.reduce((acc, c) => acc + (parseFloat(c.credit) || 0), 0);

  const currentSGPA  = calcSGPA(courses);
  const validPrev    = prevSems.filter(s => getSemSGPA(s) > 0 && getSemCredits(s) > 0);
  const hasValidPrev = validPrev.length > 0;
  const finalCGPA    = (() => {
    if (!hasValidPrev) return 0;
    let pts = 0, cr = 0;
    validPrev.forEach(s => { pts += getSemSGPA(s) * getSemCredits(s); cr += getSemCredits(s); });
    return cr > 0 ? pts / cr : 0;
  })();

  const addCourse    = () => setCourses(c => [...c, newCourse()]);
  const removeCourse = (id) => { if (courses.length > 1) setCourses(c => c.filter(x => x.id !== id)); };
  const updateCourse = (id, field, val) => setCourses(c => c.map(x => {
    if (x.id !== id) return x;
    if (field === 'credit') { const v = parseFloat(val); if (val !== '' && (isNaN(v) || v < 0 || v > 20)) return x; }
    return { ...x, [field]: val };
  }));
  const addSem    = () => setPrevSems(s => [...s, newSemester()]);
  const removeSem = (id) => setPrevSems(s => s.filter(x => x.id !== id));
  const updateSem = (id, field, val) => setPrevSems(s => s.map(sem => {
    if (sem.id !== id) return sem;
    if (field === 'sgpa') { const v = parseFloat(val); if (val !== '' && (isNaN(v) || v < 0 || v > 4)) return sem; }
    if (field === 'totalCredits') { const v = parseFloat(val); if (val !== '' && (isNaN(v) || v < 0 || v > 100)) return sem; }
    return { ...sem, [field]: val };
  }));
  const addSemCourse    = (semId) => setPrevSems(s => s.map(sem => sem.id === semId ? { ...sem, courses: [...sem.courses, newCourse()] } : sem));
  const removeSemCourse = (semId, cId) => setPrevSems(s => s.map(sem => {
    if (sem.id !== semId || sem.courses.length <= 1) return sem;
    return { ...sem, courses: sem.courses.filter(c => c.id !== cId) };
  }));
  const updateSemCourse = (semId, cId, field, val) => setPrevSems(s => s.map(sem => {
    if (sem.id !== semId) return sem;
    return {
      ...sem, courses: sem.courses.map(c => {
        if (c.id !== cId) return c;
        if (field === 'credit') { const v = parseFloat(val); if (val !== '' && (isNaN(v) || v < 0 || v > 20)) return c; }
        return { ...c, [field]: val };
      })
    };
  }));

  return (
    <div className="min-h-screen" onClick={handleClick}>
      {/* Ripple */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {ripples.map(rp => (
          <div key={rp.id} style={{ position: 'absolute', left: rp.x, top: rp.y }}>
            {[0,1].map(w => (
              <div key={w} style={{ position: 'absolute', animation: `rippleWave 1s ease-out ${w*0.18}s forwards` }}>
                {SYMBOLS.map((sym, si) => {
                  const angle = (si / SYMBOLS.length) * Math.PI * 2;
                  return <span key={si} style={{ position:'absolute',left:'50%',top:'50%',
                    transform:`translate(calc(-50% + ${Math.cos(angle)*22}px),calc(-50% + ${Math.sin(angle)*22}px))`,
                    fontSize:'10px',fontWeight:700,userSelect:'none',
                    color: d ? 'rgba(129,140,248,0.75)' : 'rgba(99,102,241,0.65)' }}>{sym}</span>;
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Logo title="CGPA Calculator" subtitle="UGC Uniform Grading System · 4.00 Scale" showBack showLang={false} />

        {/* Save status */}
        <div className={`flex items-center gap-2 mb-4 text-xs ${
          saveStatus==='saving'?(d?'text-amber-400':'text-amber-500'):saveStatus==='error'?(d?'text-red-400':'text-red-500'):(d?'text-emerald-400':'text-emerald-600')
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${saveStatus==='saving'?'bg-amber-400 animate-pulse':saveStatus==='error'?'bg-red-400':'bg-emerald-400'}`} />
          {saveStatus==='saving'?'Saving...':saveStatus==='error'?'Failed to save':'Data saved automatically'}
        </div>

        {/* Sticky */}
        <div className={`sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 ${TH.stickyBg}`}>
          {tab === 'current' && (
            <div className={`rounded-2xl p-4 border shadow-sm mb-3 ${TH.statCard}`}>
              <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${TH.textMut}`}>Current Semester SGPA</p>
              <p className={`text-3xl font-bold ${TH.statVal}`}>{currentSGPA.toFixed(2)}</p>
            </div>
          )}
          {tab === 'previous' && (
            <div className={`grid gap-3 mb-3 ${hasValidPrev ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className={`rounded-2xl p-4 border shadow-sm ${TH.statCard}`}>
                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${TH.textMut}`}>Previous Semesters</p>
                <p className={`text-3xl font-bold ${TH.statVal}`}>{validPrev.length}</p>
              </div>
              {hasValidPrev && (
                <div className={`rounded-2xl p-4 border shadow-sm ${TH.statFinal}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${TH.textMut}`}>Final CGPA</p>
                  <p className={`text-3xl font-bold ${TH.statFV}`}>{finalCGPA.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
          <div className={`flex rounded-2xl p-1 border ${TH.tabBar}`}>
            {[{key:'current',label:'Current Semester'},{key:'previous',label:'Previous Semesters'},{key:'reference',label:'Grade Reference'}].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 px-1 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${tab===t.key?TH.tabOn:TH.tabOff}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {tab === 'current' && (
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${TH.card}`}>
              <div className={`px-5 py-4 border-b ${TH.divider} flex items-center gap-2`}>
                <BookOpen className={`w-4 h-4 ${d?'text-indigo-400':'text-indigo-500'}`}/>
                <h2 className={`text-sm font-semibold ${TH.text}`}>Current Semester Courses</h2>
              </div>
              <div className="p-5 space-y-4">
                {courses.map((course, idx) => (
                  <div key={course.id} className={`rounded-xl p-4 border ${TH.inner}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${TH.badgeIn}`}>Course {idx+1}</span>
                      <button onClick={() => removeCourse(course.id)} disabled={courses.length===1}
                        className={`p-1.5 rounded-lg transition-colors ${courses.length===1?TH.trashOff:TH.trashOn}`}>
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${TH.label}`}>Course Name</label>
                        <input type="text" value={course.name} placeholder="e.g., Data Structures"
                          onChange={e => updateCourse(course.id,'name',e.target.value)}
                          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.input}`}/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${TH.label}`}>Credit Hours</label>
                          <input type="number" value={course.credit} placeholder="3" min="0" max="20" step="0.5"
                            onChange={e => updateCourse(course.id,'credit',e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.input}`}/>
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${TH.label}`}>Grade</label>
                          <select value={course.grade} onChange={e => updateCourse(course.id,'grade',e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.select}`}>
                            <option value="">Select Grade</option>
                            {Object.entries(cgpaGP).map(([g,p]) => (<option key={g} value={g}>{g} ({p.toFixed(2)})</option>))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addCourse}
                  className={`w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors ${TH.addIn}`}>
                  <Plus className="w-4 h-4"/> Add Course
                </button>
              </div>
            </div>
          )}

          {tab === 'previous' && (
            <div className="space-y-4">
              {prevSems.length === 0 && (
                <div className={`rounded-2xl border shadow-sm p-8 text-center ${TH.card}`}>
                  <p className={`text-sm ${TH.textSec}`}>No previous semesters added yet.</p>
                </div>
              )}
              {prevSems.map((sem, idx) => {
                const semSGPA = getSemSGPA(sem);
                return (
                  <div key={sem.id} className={`rounded-2xl border shadow-sm overflow-hidden ${TH.card}`}>
                    <div className={`px-5 py-3 border-b ${TH.divider} flex items-center gap-2 flex-wrap`}>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${TH.badgePu}`}>Sem {idx+1}</span>
                      <input type="text" value={sem.name} placeholder="e.g., Fall 2023"
                        onChange={e => updateSem(sem.id,'name',e.target.value)}
                        className={`flex-1 min-w-0 rounded-lg border px-2 py-1 text-sm outline-none transition-colors ${TH.input}`}/>
                      {semSGPA > 0 && <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${TH.badgeGr}`}>SGPA: {semSGPA.toFixed(2)}</span>}
                      <button onClick={() => removeSem(sem.id)} className={`p-1.5 rounded-lg shrink-0 ${TH.trashOn}`}><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="px-5 pt-4">
                      <div className={`flex rounded-xl p-0.5 mb-4 ${TH.modeBar}`}>
                        {['direct','courses'].map(m => (
                          <button key={m} onClick={() => updateSem(sem.id,'mode',m)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${sem.mode===m?TH.modeOn:TH.modeOff}`}>
                            {m==='direct'?'Direct SGPA':'Add Courses'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      {sem.mode === 'direct' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-xs font-medium mb-1 ${TH.label}`}>SGPA (0–4.00)</label>
                            <input type="number" value={sem.sgpa} placeholder="e.g., 3.75" min="0" max="4" step="0.01"
                              onChange={e => updateSem(sem.id,'sgpa',e.target.value)}
                              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.input}`}/>
                          </div>
                          <div>
                            <label className={`block text-xs font-medium mb-1 ${TH.label}`}>Total Credits</label>
                            <input type="number" value={sem.totalCredits} placeholder="e.g., 18" min="0" max="100"
                              onChange={e => updateSem(sem.id,'totalCredits',e.target.value)}
                              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${TH.input}`}/>
                          </div>
                        </div>
                      )}
                      {sem.mode === 'courses' && (
                        <div className="space-y-3">
                          <button onClick={() => updateSem(sem.id,'expanded',!sem.expanded)}
                            className={`flex items-center gap-1.5 text-xs font-medium ${d?'text-indigo-400':'text-indigo-500'}`}>
                            {sem.expanded?<><ChevronUp className="w-3 h-3"/>Hide</>:<><ChevronDown className="w-3 h-3"/>Show ({sem.courses.length})</>}
                          </button>
                          {sem.expanded !== false && sem.courses.map((c, ci) => (
                            <div key={c.id} className={`rounded-xl p-3 border ${TH.inner}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-semibold ${TH.textMut}`}>Course {ci+1}</span>
                                <button onClick={() => removeSemCourse(sem.id,c.id)} disabled={sem.courses.length===1}
                                  className={`p-1 rounded transition-colors ${sem.courses.length===1?TH.trashOff:TH.trashOn}`}>
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <label className={`block text-xs font-medium mb-1 ${TH.label}`}>Course Name</label>
                                  <input type="text" value={c.name} placeholder="e.g., Calculus"
                                    onChange={e => updateSemCourse(sem.id,c.id,'name',e.target.value)}
                                    className={`w-full rounded-lg border px-2 py-1.5 text-xs outline-none ${TH.input}`}/>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${TH.label}`}>Credit Hours</label>
                                    <input type="number" value={c.credit} placeholder="3" min="0" max="20" step="0.5"
                                      onChange={e => updateSemCourse(sem.id,c.id,'credit',e.target.value)}
                                      className={`w-full rounded-lg border px-2 py-1.5 text-xs outline-none ${TH.input}`}/>
                                  </div>
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${TH.label}`}>Grade</label>
                                    <select value={c.grade} onChange={e => updateSemCourse(sem.id,c.id,'grade',e.target.value)}
                                      className={`w-full rounded-lg border px-2 py-1.5 text-xs outline-none ${TH.select}`}>
                                      <option value="">Select</option>
                                      {Object.entries(cgpaGP).map(([g,p]) => (<option key={g} value={g}>{g} ({p.toFixed(2)})</option>))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => addSemCourse(sem.id)}
                            className={`w-full py-2 rounded-xl border border-dashed text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${TH.addIn}`}>
                            <Plus className="w-3 h-3"/> Add Course
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <button onClick={addSem}
                className={`w-full py-3 rounded-2xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors ${TH.addPu}`}>
                <Plus className="w-4 h-4"/> Add Previous Semester
              </button>
            </div>
          )}

          {tab === 'reference' && (
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${TH.card}`}>
              <div className={`px-5 py-4 border-b ${TH.divider}`}>
                <h2 className={`text-base font-semibold ${TH.text}`}>UGC Uniform Grading System</h2>
                <p className={`text-sm mt-0.5 ${TH.textSec}`}>Bangladesh University Grants Commission</p>
              </div>
              <div className={`divide-y ${TH.divider}`}>
                {Object.entries(cgpaGP).map(([grade, pts]) => (
                  <div key={grade} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${cgpaColors[grade]}`}>{grade}</span>
                      <span className={`text-sm ${TH.textSec}`}>{cgpaLabel[grade]}</span>
                    </div>
                    <span className={`text-sm font-semibold ${TH.statVal}`}>{pts.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className={`text-center text-xs mt-8 ${TH.textMut}`}>Grade Calculator Bangladesh · UGC System</p>
      </div>
    </div>
  );
}
