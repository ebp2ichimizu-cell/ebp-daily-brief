const INDEX_URL = "data/index.json";

let allBriefs = [];
let selectedTag = "";

async function loadJson(url){
  const res = await fetch(url, {cache:"no-store"});
  if(!res.ok) throw new Error(`読み込み失敗: ${url}`);
  return res.json();
}

function esc(v=""){
  return String(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function jpDate(date){
  const d = new Date(date+"T00:00:00");
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function badge(text){ return `<span class="badge">${esc(text)}</span>`; }

function articleHtml(a, expanded=false){
  const tags = (a.tags||[]).map(badge).join("");
  const region = a.region==="international" ? "海外" : "国内";
  const src = a.source || {};
  const facts = (a.facts||[]).map(x=>`<li>${esc(x)}</li>`).join("");
  const limits = (a.limitations||[]).map(x=>`<li>${esc(x)}</li>`).join("");
  const related = (a.related_research||[]).map(x =>
    `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></li>`
  ).join("");
  return `
    <article class="article-card" data-article-id="${esc(a.id||"")}">
      <h3 class="article-title">${esc(a.title)}</h3>
      <div class="meta">${badge(region)}${tags}</div>
      <p class="summary">${esc(a.summary||"")}</p>
      <div class="actions">
        ${src.url ? `<a class="text-link" href="${esc(src.url)}" target="_blank" rel="noopener">原典を見る</a>` : ""}
      </div>
      <details class="article-detail" ${expanded?"open":""}>
        <summary>詳しく読む</summary>
        ${facts ? `<div class="detail-block"><h4>確認された事実</h4><ul>${facts}</ul></div>` : ""}
        ${a.interpretation ? `<div class="detail-block"><h4>どう読むか</h4><p>${esc(a.interpretation)}</p></div>` : ""}
        ${a.evidence?.description ? `<div class="detail-block"><h4>エビデンス</h4><p>${esc(a.evidence.description)}</p></div>` : ""}
        ${limits ? `<div class="detail-block"><h4>限界・反証材料</h4><ul>${limits}</ul></div>` : ""}
        ${a.implications ? `<div class="detail-block"><h4>日本の実務への示唆</h4><p>${esc(a.implications)}</p></div>` : ""}
        ${src.name || src.title ? `<div class="detail-block"><h4>情報源</h4><p>${esc(src.name||"")}${src.title ? `「${esc(src.title)}」` : ""}${src.published_date ? `（${esc(src.published_date)}）` : ""}</p></div>` : ""}
        ${related ? `<div class="detail-block"><h4>関連する研究HUB等</h4><ul>${related}</ul></div>` : ""}
      </details>
    </article>`;
}

function requestedArticleId(){
  const params = new URLSearchParams(window.location.search);
  return (params.get("article") || "").trim();
}

function renderRequestedArticle(){
  const id = requestedArticleId();

  if(!id){
    return false;
  }

  const row = allBriefs
    .flatMap(b => b.articles.map(a => ({date:b.date,a})))
    .find(x => String(x.a.id||"") === id);

  const count = document.getElementById("searchCount");
  const results = document.getElementById("searchResults");

  if(!row){
    count.textContent = "指定された記事が見つかりませんでした。";
    results.innerHTML = "";
    return true;
  }

  count.textContent = `${jpDate(row.date)}の記事`;
  results.innerHTML =
    `<p class="muted">${jpDate(row.date)}</p>${articleHtml(row.a,true)}`;

  window.setTimeout(() => {
    results.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });
  }, 80);

  return true;
}

async function init(){
  try{
    const idx = await loadJson(INDEX_URL);
    const entries = [...idx.entries].sort((a,b)=>b.date.localeCompare(a.date));
    allBriefs = await Promise.all(entries.map(async e => {
      const data = await loadJson(e.file);
      return data;
    }));
    renderLatest();
    renderTags();
    renderArchive();
    bindSearch();

    if(!renderRequestedArticle()){
      runSearch();
    }
  }catch(err){
    document.getElementById("latestBrief").innerHTML = `<p>データを読み込めませんでした。</p>`;
    console.error(err);
  }
}

function renderLatest(){
  const brief = allBriefs[0];
  if(!brief){ return; }
  const box = document.getElementById("latestBrief");
  box.innerHTML = `<p class="brief-date">${jpDate(brief.date)}　${brief.articles.length}件</p>` +
    brief.articles.map(a=>articleHtml(a)).join("");
  const pdf = document.getElementById("latestPdf");
  if(brief.pdf_url){
    pdf.href = brief.pdf_url;
    pdf.classList.remove("hidden");
  }
}

function renderTags(){
  const tags = [...new Set(allBriefs.flatMap(b => b.articles.flatMap(a => a.tags||[])))].sort();
  const box = document.getElementById("tagFilters");
  box.innerHTML = tags.map(t=>`<button class="tag-button" data-tag="${esc(t)}">${esc(t)}</button>`).join("");
  box.addEventListener("click", e=>{
    const btn=e.target.closest("[data-tag]"); if(!btn) return;
    const t=btn.dataset.tag;
    selectedTag = selectedTag===t ? "" : t;
    box.querySelectorAll(".tag-button").forEach(x=>x.classList.toggle("active",x.dataset.tag===selectedTag));
    runSearch();
  });
}

function bindSearch(){
  ["searchInput","regionFilter","sourceTypeFilter"].forEach(id=>{
    document.getElementById(id).addEventListener("input",runSearch);
    document.getElementById(id).addEventListener("change",runSearch);
  });
}

function runSearch(){
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const region = document.getElementById("regionFilter").value;
  const type = document.getElementById("sourceTypeFilter").value;
  let rows = allBriefs.flatMap(b => b.articles.map(a=>({date:b.date,a})));
  const active = q || region || type || selectedTag;
  if(!active){
    document.getElementById("searchResults").innerHTML="";
    document.getElementById("searchCount").textContent="キーワードや条件を指定すると、過去記事を横断検索できます。";
    return;
  }
  rows = rows.filter(({a})=>{
    const src=a.source||{};
    const hay = [
      a.title,a.summary,a.interpretation,a.implications,src.name,src.title,
      ...(a.tags||[]),...(a.facts||[]),...(a.limitations||[])
    ].join(" ").toLowerCase();
    return (!q || hay.includes(q))
      && (!region || a.region===region)
      && (!type || src.type===type)
      && (!selectedTag || (a.tags||[]).includes(selectedTag));
  });
  document.getElementById("searchCount").textContent=`検索結果 ${rows.length}件`;
  document.getElementById("searchResults").innerHTML=rows.map(({date,a}) =>
    `<p class="muted">${jpDate(date)}</p>${articleHtml(a)}`
  ).join("");
}

function renderArchive(){
  const byMonth = {};
  allBriefs.forEach(b=>{
    const month=b.date.slice(0,7);
    (byMonth[month] ||= []).push(b);
  });
  const months=Object.keys(byMonth).sort().reverse();
  document.getElementById("archive").innerHTML = months.map((m,mi)=>{
    const [y,mo]=m.split("-");
    const days=byMonth[m].sort((a,b)=>b.date.localeCompare(a.date));
    return `<details class="archive-month">
      <summary>${y}年${Number(mo)}月　${days.reduce((n,b)=>n+b.articles.length,0)}件</summary>
      ${days.map((b,di)=>`
        <details class="archive-day">
          <summary>${jpDate(b.date)}　${b.articles.length}件</summary>
          <ol class="archive-list">
            ${b.articles.map(a=>`<li><a href="?article=${encodeURIComponent(a.id)}" data-article-id="${esc(a.id)}">${esc(a.title)}</a></li>`).join("")}
          </ol>
          ${b.pdf_url ? `<p><a class="text-link" href="${esc(b.pdf_url)}" target="_blank" rel="noopener">この日のPDF版を開く</a></p>`:""}
        </details>`).join("")}
    </details>`;
  }).join("");

  document.getElementById("archive").addEventListener("click", e=>{
    const link=e.target.closest("[data-article-id]");
    if(!link) return;
    e.preventDefault();
    const id=link.dataset.articleId;
    const row=allBriefs.flatMap(b=>b.articles.map(a=>({date:b.date,a}))).find(x=>x.a.id===id);
    if(row){
      const url = new URL(window.location.href);
      url.searchParams.set("article", id);
      window.history.replaceState({}, "", url);

      document.getElementById("searchInput").value="";
      document.getElementById("regionFilter").value="";
      document.getElementById("sourceTypeFilter").value="";
      selectedTag="";
      document.querySelectorAll(".tag-button").forEach(x=>x.classList.remove("active"));

      renderRequestedArticle();
    }
  });
}

init();
