/* app.js – STEP 4-1 (결과 출력 FIX 완료본) */

function $(id) {
  return document.getElementById(id);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/* ================= UI 제어 ================= */

function getCalendarType() {
  return document.querySelector('input[name="calendarType"]:checked').value;
}

function updateUI() {
  const isLunar = getCalendarType() === "lunar";
  $("engineRow").classList.toggle("hidden", !isLunar);
  $("leapRow").classList.toggle("hidden", !isLunar);

  const engine = $("lunarEngine").value;
  $("engineBadge").textContent =
    engine === "kasi" ? "엔진: KASI(오프라인)" : "엔진: 범용";
}

/* ================= 음력 → 양력 (KASI) ================= */

function lunarToSolar_KASI(y, m, d, isLeap) {
  if (typeof KoreanLunarCalendar === "undefined") {
    throw new Error(
      "KASI 엔진이 로드되지 않았습니다.\n" +
      "vendor/korean-lunar-calendar.min.js 파일을 확인하세요."
    );
  }

  const cal = new KoreanLunarCalendar();
  const ok = cal.setLunarDate(
    Number(y),
    Number(m),
    Number(d),
    Boolean(isLeap)
  );

  if (!ok) {
    throw new Error("KASI 엔진에서 유효하지 않은 음력 날짜로 판단했습니다.");
  }

  const solar = cal.getSolarCalendar();
  return {
    year: Number(solar.year),
    month: Number(solar.month),
    day: Number(solar.day),
  };
}

/* 범용 엔진은 차단 */
function lunarToSolar_UniversalBlocked() {
  throw new Error(
    "범용 음력 변환 엔진은 정확도 이슈로 비활성화되었습니다.\n" +
    "KASI(오프라인) 엔진을 선택하세요."
  );
}

/* ================= STEP 4-1 핵심 ================= */
/* 확정된 양력 → (임시) 사주 계산 엔진 */

function computeSajuWithSolarDate(solar) {
  const hour = Number($("hour").value);
  const minute = Number($("minute").value);

  return {
    solarResolved: `${solar.year}-${pad2(solar.month)}-${pad2(solar.day)}`,
    time: `${pad2(hour)}:${pad2(minute)}`,
    message: "STEP 4-1 성공: 양력 확정 → 사주 계산 엔진 전달 완료"
  };
}

/* ================= 메인 실행 ================= */

function onCalc() {
  $("err").textContent = "";
  $("msg").textContent = "";
  $("debug").textContent = "";

  try {
    const calendarType = getCalendarType();
    const engine = $("lunarEngine").value;
    const isLeap = $("isLeapMonth").value === "true";

    const y = Number($("year").value);
    const m = Number($("month").value);
    const d = Number($("day").value);

    let solar = { year: y, month: m, day: d };

    if (calendarType === "lunar") {
      if (engine === "kasi") {
        solar = lunarToSolar_KASI(y, m, d, isLeap);
      } else {
        solar = lunarToSolar_UniversalBlocked();
      }
    }

    const result = computeSajuWithSolarDate(solar);

    /* 🔴 핵심 FIX: 결과를 화면에 반드시 출력 */
    $("msg").textContent =
      `입력(${calendarType === "lunar" ? "음력" : "양력"}) → ` +
      `사주 계산용 양력 확정: ${result.solarResolved}`;

    $("debug").textContent = JSON.stringify(
      {
        input: {
          calendarType,
          engine,
          isLeap,
          year: y,
          month: m,
          day: d,
          hour: $("hour").value,
          minute: $("minute").value
        },
        solarResolved: result.solarResolved,
        result
      },
      null,
      2
    );

  } catch (e) {
    $("err").textContent = e.message;
  }
}

/* ================= 초기화 ================= */

function init() {
  document
    .querySelectorAll('input[name="calendarType"]')
    .forEach(el => el.addEventListener("change", updateUI));

  $("lunarEngine").addEventListener("change", updateUI);
  $("btnCalc").addEventListener("click", onCalc);

  updateUI();
}

init();
