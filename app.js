(() => {
  "use strict";
  const EXAM_SIZE = 80;
  const EXAM_SECONDS = 180 * 60;
  const DATA_URL = "data/questions.json";
  const $ = (id) => document.getElementById(id);
  const screens = ["loading-screen","start-screen","instruction-screen","exam-screen","result-screen"];
  let bank = [], exam = [], answers = {}, doubts = new Set(), current = 0;
  let candidate = {name:"",major:""}, remaining = EXAM_SECONDS, timerId = null, finished = false;
  let results = null;

  function showScreen(id) { screens.forEach(s => $(s).classList.toggle("hidden", s !== id)); }
  function shuffle(arr) {
    const a = [...arr];
    for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function normalizedType(q) {
    if (q.type === "PG") return "PG";
    if (q.type === "PGK MCMA") return "MCMA";
    if (String(q.type).startsWith("PGK Kategori") || q.type === "PGK Kategori") return "CATEGORY";
    return "PG";
  }
  function labelType(q) {
    const t=normalizedType(q);
    return t==="PG" ? "Pilihan Ganda" : t==="MCMA" ? "PGK MCMA · Multi-jawaban" : "PGK Kategori · Tabel";
  }
  async function loadBank() {
    try {
      const response = await fetch(DATA_URL, {cache:"no-store"});
      if (!response.ok) throw new Error("Bank soal tidak dapat dimuat ("+response.status+").");
      bank = await response.json();
      if (!Array.isArray(bank) || bank.length < EXAM_SIZE) throw new Error("Bank soal harus berisi minimal 80 soal.");
      $("pool-count").textContent = bank.length;
      showScreen("start-screen");
    } catch (err) {
      $("loading-screen").innerHTML = `<h1>Bank soal belum dapat dimuat</h1><p>${escapeHTML(err.message)}</p><p>Pastikan file <b>data/questions.json</b> ikut diunggah ke GitHub dan nama foldernya tepat.</p><button class="secondary-btn" onclick="location.reload()">Coba Lagi</button>`;
    }
  }
  function makeExam() {
    // Stratified draw: preserve a varied mix of all three item formats and all four difficulty levels.
    const quotas = {"Pilihan Ganda":36,"PGK Kategori":22,"PGK MCMA":22};
    const difficulties = ["Mudah","Sedang","Sulit","Sangat Sulit"];
    const chosen = [];
    const used = new Set();
    Object.keys(quotas).forEach(type => {
      difficulties.forEach(level => {
        const candidates = bank.filter(q => q.typeLabel===type && q.difficulty===level && !used.has(q.id));
        if (candidates.length) { const pick=shuffle(candidates)[0]; chosen.push(pick); used.add(pick.id); }
      });
    });
    Object.entries(quotas).forEach(([type,quota]) => {
      const remainingForType = shuffle(bank.filter(q=>q.typeLabel===type&&!used.has(q.id)));
      const needed = quota - chosen.filter(q=>q.typeLabel===type).length;
      remainingForType.slice(0,Math.max(0,needed)).forEach(q=>{chosen.push(q);used.add(q.id);});
    });
    exam = shuffle(chosen).slice(0,EXAM_SIZE);
    if (!$("shuffle-questions").checked) exam.sort((a,b)=>String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
    answers = {}; doubts = new Set(); current = 0; remaining = EXAM_SECONDS; finished = false; results = null;
  }
  function startTimer() {
    clearInterval(timerId);
    updateTimer();
    timerId = setInterval(() => {
      if (finished) return;
      remaining = Math.max(0, remaining-1);
      updateTimer();
      if (remaining <= 0) finishExam(true);
    },1000);
  }
  function updateTimer() {
    const h=String(Math.floor(remaining/3600)).padStart(2,"0");
    const m=String(Math.floor((remaining%3600)/60)).padStart(2,"0");
    const s=String(remaining%60).padStart(2,"0");
    $("timer").textContent=`${h}:${m}:${s}`;
    $("timer").parentElement.classList.toggle("urgent",remaining<=300);
  }
  function getAnswer(q) { return answers[q.id]; }
  function isAnswered(q) {
    const a=getAnswer(q), t=normalizedType(q);
    if (t==="PG") return typeof a==="string" && a.length>0;
    if (t==="MCMA") return Array.isArray(a) && a.length>0;
    return Array.isArray(a) && a.some(x=>x!==null && x!==undefined && x!=="");
  }
  function renderQuestion() {
    if (finished) return;
    const q=exam[current], t=normalizedType(q), a=getAnswer(q);
    $("question-number").textContent=`SOAL ${current+1} / ${EXAM_SIZE}`;
    $("question-type").textContent=labelType(q);
    $("question-difficulty").textContent=q.difficulty || "Latihan";
    $("question-code").textContent=q.code || "—";
    $("question-stem").textContent=q.stem || "";
    $("source-note").textContent=q.source==="Pengembangan" ? "Soal pengembangan latihan" : `Sumber: ${q.source==="PCK"?"Bank PCK Pendidikan Pancasila":"Bank Pedagogi Umum"}`;
    $("answered-state").textContent=isAnswered(q)?"Sudah dijawab":"Belum dijawab";
    $("doubt-btn").classList.toggle("active",doubts.has(q.id));
    $("doubt-btn").textContent=doubts.has(q.id)?"★ Ditandai Ragu":"☆ Ragu-ragu";
    $("prev-btn").disabled=current===0;
    $("next-btn").textContent=current===EXAM_SIZE-1?"Ke Soal Terakhir":"Selanjutnya →";
    const area=$("answer-area");
    if (t==="PG") {
      area.innerHTML=q.options.map(o=>`<label class="option ${a===o.id?"selected":""}"><input type="radio" name="answer" value="${escapeHTML(o.id)}" ${a===o.id?"checked":""}><span class="option-key">${escapeHTML(o.id)}.</span><span class="option-text">${escapeHTML(o.text)}</span></label>`).join("");
      area.querySelectorAll('input[name="answer"]').forEach(el=>el.addEventListener("change",()=>{answers[q.id]=el.value;renderQuestion();}));
    } else if (t==="MCMA") {
      const selected=Array.isArray(a)?a:[];
      area.innerHTML=`<div class="answer-hint">Pilih semua opsi yang benar. Jawaban dapat lebih dari satu.</div>`+q.options.map(o=>`<label class="option ${selected.includes(o.id)?"selected":""}"><input type="checkbox" name="answer" value="${escapeHTML(o.id)}" ${selected.includes(o.id)?"checked":""}><span class="option-key">${escapeHTML(o.id)}.</span><span class="option-text">${escapeHTML(o.text)}</span></label>`).join("");
      area.querySelectorAll('input[name="answer"]').forEach(el=>el.addEventListener("change",()=>{
        let next=[...selected]; if(el.checked){if(!next.includes(el.value))next.push(el.value);}else next=next.filter(x=>x!==el.value);
        answers[q.id]=next;renderQuestion();
      }));
    } else {
      const cats=q.categories?.length?q.categories:["Tepat","Tidak Tepat"];
      const values=Array.isArray(a)?a:[];
      area.innerHTML=`<div class="answer-hint">Pilih satu kategori untuk setiap pernyataan.</div><table class="category-table"><thead><tr><th>Pernyataan</th>${cats.map(c=>`<th>${escapeHTML(c)}</th>`).join("")}</tr></thead><tbody>${q.options.map((o,i)=>`<tr><td>${escapeHTML(o.text)}</td>${cats.map(c=>`<td><input aria-label="Pernyataan ${i+1}: ${escapeHTML(c)}" type="radio" name="row-${i}" value="${escapeHTML(c)}" ${values[i]===c?"checked":""}></td>`).join("")}</tr>`).join("")}</tbody></table>`;
      q.options.forEach((o,i)=>area.querySelectorAll(`input[name="row-${i}"]`).forEach(el=>el.addEventListener("change",()=>{
        let next=Array.isArray(answers[q.id])?[...answers[q.id]]:Array(q.options.length).fill(null);
        next[i]=el.value;answers[q.id]=next;renderQuestion();
      })));
    }
    renderNavigation();
  }
  function renderNavigation() {
    const grid=$("question-grid");
    grid.innerHTML=exam.map((q,i)=>{
      const cls=[isAnswered(q)?"answered":"",doubts.has(q.id)?"doubt":"",i===current?"current":""].filter(Boolean).join(" ");
      return `<button class="qnum ${cls}" data-index="${i}" aria-label="Nomor ${i+1}">${i+1}</button>`;
    }).join("");
    grid.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{current=Number(b.dataset.index);renderQuestion();}));
    const count=exam.filter(isAnswered).length;
    $("nav-count").textContent=`${count}/${EXAM_SIZE}`;
    $("progress-text").textContent=`Terjawab ${count} dari ${EXAM_SIZE}`;
    $("progress-percent").textContent=`${Math.round(count/EXAM_SIZE*100)}%`;
    $("progress-bar").style.width=`${count/EXAM_SIZE*100}%`;
  }
  function toggleDoubt(){const id=exam[current].id;if(doubts.has(id))doubts.delete(id);else doubts.add(id);renderQuestion();}
  function calculateQuestion(q) {
    const t=normalizedType(q), user=answers[q.id], key=q.answer;
    if(t==="PG") return {points:user===key?1:0, exact:user===key};
    if(t==="MCMA") {
      const selected=Array.isArray(user)?user:[], correct=Array.isArray(key)?key:[];
      if(!selected.length)return {points:0,exact:false};
      const hits=selected.filter(x=>correct.includes(x)).length;
      const misses=selected.filter(x=>!correct.includes(x)).length;
      const points=Math.max(0,(hits-misses)/Math.max(1,correct.length));
      return {points:Math.min(1,points),exact:selected.length===correct.length&&hits===correct.length};
    }
    const selected=Array.isArray(user)?user:[], correct=Array.isArray(key)?key:[];
    if(!selected.length)return {points:0,exact:false};
    let hits=0,attempted=0;
    correct.forEach((c,i)=>{if(selected[i]){attempted++;if(selected[i]===c)hits++;}});
    const points=hits/Math.max(1,correct.length);
    return {points,exact:correct.length>0&&hits===correct.length&&attempted===correct.length};
  }
  function finishExam(auto=false) {
    if(finished)return;
    if(!auto && !window.confirm) return;
    finished=true;clearInterval(timerId);
    const rows=exam.map(q=>({q,...calculateQuestion(q)}));
    const points=rows.reduce((s,r)=>s+r.points,0);
    const exact=rows.filter(r=>r.exact).length;
    const partial=rows.filter(r=>r.points>0&&!r.exact).length;
    const answered=exam.filter(isAnswered).length;
    results={rows,score:Math.round(points/EXAM_SIZE*100),exact,partial,wrong:EXAM_SIZE-exact-partial,answered,auto};
    showResults();
  }
  function showResults() {
    showScreen("result-screen");
    $("result-title").textContent=results.auto?"Waktu Habis":"Ujian Selesai";
    $("result-candidate").textContent=`${candidate.name} · ${candidate.major}`;
    $("score-value").textContent=results.score;
    $("result-summary").textContent=`Perolehan ${results.score} dari 100 · ${results.answered} soal telah dijawab · ${results.auto?"Jawaban dikumpulkan otomatis saat waktu habis.":"Jawaban berhasil dikumpulkan."}`;
    $("correct-count").textContent=results.exact;
    $("partial-count").textContent=results.partial;
    $("wrong-count").textContent=results.wrong;
    $("answered-count").textContent=results.answered;
    $("review-total").textContent=`${EXAM_SIZE} soal`;
    $("review-section").classList.add("hidden");
    $("review-toggle").textContent="Lihat Pembahasan & Kunci";
    $("review-list").innerHTML=results.rows.map((r,i)=>renderReview(r,i)).join("");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function answerSummary(q) {
    const a=answers[q.id],t=normalizedType(q);
    if(t==="PG")return a||"Tidak dijawab";
    if(t==="MCMA")return Array.isArray(a)&&a.length?a.join(", "):"Tidak dijawab";
    return Array.isArray(a)?a.map((x,i)=>`${i+1}: ${x||"—"}`).join(" · "):"Tidak dijawab";
  }
  function keySummary(q) {
    if(normalizedType(q)==="CATEGORY")return q.answer.map((x,i)=>`${i+1}: ${x}`).join(" · ");
    return Array.isArray(q.answer)?q.answer.join(", "):q.answer;
  }
  function renderReview(r,i) {
    const q=r.q, t=normalizedType(q), a=answers[q.id], key=q.answer;
    const status=r.exact?["Benar","correct"]:r.points>0?["Sebagian benar","partial"]:["Belum tepat","wrong"];
    let options="";
    if(t==="CATEGORY") {
      options=q.options.map((o,j)=>{
        const ua=Array.isArray(a)?a[j]:null, ka=key[j];
        return `<div class="review-option ${ua===ka?"correct-answer":ua?"user-wrong":""}"><b>${j+1}.</b> ${escapeHTML(o.text)}<br>Jawaban Anda: ${escapeHTML(ua||"Tidak dijawab")} · Kunci: <b>${escapeHTML(ka)}</b></div>`;
      }).join("");
    } else {
      options=q.options.map(o=>{
        const isKey=t==="PG"?o.id===key:Array.isArray(key)&&key.includes(o.id);
        const selected=t==="PG"?a===o.id:Array.isArray(a)&&a.includes(o.id);
        const cls=isKey?"correct-answer":selected&&!isKey?"user-wrong":"";
        return `<div class="review-option ${cls}"><b>${escapeHTML(o.id)}.</b> ${escapeHTML(o.text)}${isKey?" · Kunci":selected?" · Pilihan Anda":""}</div>`;
      }).join("");
    }
    return `<article class="review-card"><div class="review-top"><b>Soal ${i+1}</b><span class="status-tag ${status[1]}">${status[0]}</span><span class="status-tag">${escapeHTML(q.code||"")}</span><span class="status-tag">${escapeHTML(q.difficulty||"")}</span><span class="status-tag">${Math.round(r.points*100)}% poin</span></div><div class="review-stem">${escapeHTML(q.stem)}</div>${options}<div class="review-key">Jawaban Anda: ${escapeHTML(answerSummary(q))}<br>Kunci jawaban: ${escapeHTML(keySummary(q))}</div><div class="review-explanation"><b>Pembahasan:</b> ${escapeHTML(q.explanation||"Tidak ada pembahasan tambahan pada butir ini.")}</div></article>`;
  }
  function requestFinish() {
    const unanswered=EXAM_SIZE-exam.filter(isAnswered).length;
    $("modal-message").textContent=unanswered?`Masih ada ${unanswered} soal yang belum dijawab. Jika diselesaikan sekarang, soal tersebut akan dihitung kosong. Lanjutkan?`:"Semua soal sudah dijawab. Apakah Anda yakin ingin mengumpulkan jawaban?";
    $("confirm-modal").classList.remove("hidden");
  }

  $("candidate-form").addEventListener("submit",e=>{
    e.preventDefault();
    const name=$("candidate-name").value.trim(),major=$("candidate-major").value.trim();
    if(!name||!major)return;
    candidate={name,major};$("exam-candidate").textContent=name;$("exam-meta").textContent=`${major} · ${EXAM_SIZE} soal`;
    showScreen("instruction-screen");
  });
  $("begin-exam").addEventListener("click",()=>{
    makeExam();showScreen("exam-screen");renderQuestion();startTimer();window.scrollTo({top:0,behavior:"smooth"});
  });
  $("prev-btn").addEventListener("click",()=>{if(current>0){current--;renderQuestion();}});
  $("next-btn").addEventListener("click",()=>{if(current<EXAM_SIZE-1){current++;renderQuestion();}});
  $("doubt-btn").addEventListener("click",toggleDoubt);
  $("finish-btn").addEventListener("click",requestFinish);
  $("cancel-finish").addEventListener("click",()=>$("confirm-modal").classList.add("hidden"));
  $("confirm-finish").addEventListener("click",()=>{$("confirm-modal").classList.add("hidden");finishExam(false);});
  $("review-toggle").addEventListener("click",()=>{
    $("review-section").classList.toggle("hidden");
    $("review-toggle").textContent=$("review-section").classList.contains("hidden")?"Lihat Pembahasan & Kunci":"Sembunyikan Pembahasan";
    if(!$("review-section").classList.contains("hidden"))$("review-section").scrollIntoView({behavior:"smooth"});
  });
  $("reset-btn").addEventListener("click",()=>{
    if(!window.confirm("Mulai sesi baru? Hasil sesi ini akan digantikan dan 80 soal baru akan diacak dari bank soal."))return;
    $("review-section").classList.add("hidden");makeExam();showScreen("exam-screen");renderQuestion();startTimer();window.scrollTo({top:0,behavior:"smooth"});
  });
  loadBank();
})();