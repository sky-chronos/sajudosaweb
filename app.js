const STORAGE_KEY = "saju_dosa_input_v1";
const THEME_KEY = "saju_dosa_theme";

function $(id){ return document.getElementById(id); }
function pad2(n){ return String(n).padStart(2,"0"); }
function mod(n,m){ return ((n%m)+m)%m; }

/* ===== UI ===== */
function getCalendarType(){
  return document.querySelector('input[name="calendarType"]:checked').value;
}

function updateUI(){
  const isLunar = getCalendarType()==="lunar";
  $("engineRow").classList.toggle("hidden", !isLunar);
  $("leapRow").classList.toggle("hidden", !isLunar);
  $("engineBadge").textContent =
    $("lunarEngine").value==="kasi" ? "엔진: KASI" : "엔진: 범용";
}

/* ===== Theme ===== */
function applyTheme(theme){
  document.body.classList.toggle("dark", theme==="dark");
  $("btnTheme").textContent = theme==="dark" ? "☀️ 라이트모드" : "🌙 다크모드";
}
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved){
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}
$("btnTheme").onclick = ()=>{
  const isDark = document.body.classList.contains("dark");
  const next = isDark ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
};

/* ===== localStorage ===== */
function saveInputs(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    calendarType: getCalendarType(),
    lunarEngine: $("lunarEngine").value,
    isLeapMonth: $("isLeapMonth").value,
    year: $("year").value,
    month: $("month").value,
    day: $("day").value,
    hour: $("hour").value,
    minute: $("minute").value
  }));
}

function loadInputs(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  const d = JSON.parse(raw);
  document.querySelector(`input[value="${d.calendarType}"]`).checked = true;
  $("lunarEngine").value = d.lunarEngine;
  $("isLeapMonth").value = d.isLeapMonth;
  $("year").value = d.year;
  $("month").value = d.month;
  $("day").value = d.day;
  $("hour").value = d.hour;
  $("minute").value = d.minute;
  updateUI();
}

function resetInputs(){
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

/* ===== KASI ===== */
function lunarToSolar_KASI(y,m,d,isLeap){
  const cal = new KoreanLunarCalendar();
  if(!cal.setLunarDate(y,m,d,isLeap)) throw new Error("음력 오류");
  const s = cal.getSolarCalendar();
  return {year:s.year, month:s.month, day:s.day};
}

/* ===== Constants ===== */
const STEMS=["갑","을","병","정","무","기","경","신","임","계"];
const BRANCHES=["자","축","인","묘","진","사","오","미","신","유","술","해"];

/* ===== Saju ===== */
function yearPillar(y,m,d){
  const uy=(m<2||(m===2&&d<4))?y-1:y;
  return {stem:STEMS[mod(uy-4,10)],branch:BRANCHES[mod(uy-4,12)]};
}
function monthPillar(y,m){
  return {stem:STEMS[mod(y*12+m,10)],branch:BRANCHES[mod(m+1,12)]};
}
function dayPillar(y,m,d){
  const base=new Date(1900,0,1),cur=new Date(y,m-1,d);
  const diff=Math.floor((cur-base)/86400000);
  return {stem:STEMS[mod(diff,10)],branch:BRANCHES[mod(diff,12)]};
}
function hourPillar(ds,h){
  const br=Math.floor((h+1)/2)%12;
  return {stem:STEMS[mod(STEMS.indexOf(ds)*2+br,10)],branch:BRANCHES[br]};
}

/* ===== Luck ===== */
function buildLuck(p,y){
  let t="\n[대운]\n";
  const ms=STEMS.indexOf(p.month.stem),mb=BRANCHES.indexOf(p.month.branch);
  for(let i=1;i<=6;i++) t+=`- ${i*10}세: ${STEMS[mod(ms+i,10)]}${BRANCHES[mod(mb+i,12)]}\n`;
  t+="\n[세운]\n";
  for(let i=y-3;i<=y+3;i++) t+=`- ${i}: ${STEMS[mod(i-4,10)]}${BRANCHES[mod(i-4,12)]}\n`;
  t+="\n[월운]\n";
  for(let m=1;m<=12;m++) t+=`- ${m}월: ${STEMS[mod(y*12+m,10)]}${BRANCHES[mod(m+1,12)]}\n`;
  return t;
}

/* ===== Calc ===== */
function onCalc(){
  $("err").textContent="";
  const y=+$("year").value,m=+$("month").value,d=+$("day").value;
  const hh=+$("hour").value,mm=+$("minute").value;
  let solar={year:y,month:m,day:d};
  if(getCalendarType()==="lunar"){
    solar=lunarToSolar_KASI(y,m,d,$("isLeapMonth").value==="true");
  }
  const dp=dayPillar(solar.year,solar.month,solar.day);
  const p={
    year:yearPillar(solar.year,solar.month,solar.day),
    month:monthPillar(solar.year,solar.month),
    day:dp,
    hour:hourPillar(dp.stem,hh)
  };
  $("debug").textContent=
`[사주도사 웹계산 결과 – STEP 4-4]

[출생 정보]
- ${solar.year}-${pad2(solar.month)}-${pad2(solar.day)} ${pad2(hh)}:${pad2(mm)}

[사주 팔자]
- 년주: ${p.year.stem}${p.year.branch}
- 월주: ${p.month.stem}${p.month.branch}
- 일주: ${p.day.stem}${p.day.branch}
- 시주: ${p.hour.stem}${p.hour.branch}
${buildLuck(p,solar.year)}
`;
  $("msg").textContent="계산 완료";
  saveInputs();
}

/* ===== Result Toggle & Copy ===== */
let visible=true;
$("btnToggleResult").onclick=()=>{
  visible=!visible;
  $("debug").style.display=visible?"block":"none";
  $("btnToggleResult").textContent=visible?"접기 ▲":"펼치기 ▼";
};
$("btnCopy").onclick=()=>navigator.clipboard.writeText($("debug").textContent);
$("btnCopyGPT").onclick=()=>navigator.clipboard.writeText(
  "아래 내용은 계산된 사주입니다. 계산 변경 없이 해석만 해주세요.\n\n"+$("debug").textContent
);

/* ===== Init ===== */
function init(){
  document.querySelectorAll('input[name="calendarType"]').forEach(el=>el.onchange=updateUI);
  $("btnCalc").onclick=onCalc;
  $("btnReset").onclick=resetInputs;
  updateUI();
  loadInputs();
  initTheme();
}
init();
