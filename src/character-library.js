const STORAGE_KEY = 'frameforge-character-library-v2';
const SELECTED_KEY = 'frameforge-selected-characters-v1';
const FAVORITES_KEY = 'frameforge-character-favorites-v1';
const MAX_CUSTOM = 8;

const PORTRAIT_SPRITE = 'data:image/jpeg;base64,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';

const people = [
{id:'zara',name:'Zara',type:'women',age:'adult',slot:0},
{id:'mei',name:'Mei',type:'women',age:'young',slot:1},
{id:'james',name:'James',type:'men',age:'older',slot:2},
{id:'priya',name:'Priya',type:'women',age:'adult',slot:3},
{id:'mason',name:'Mason',type:'men',age:'adult',slot:4},
{id:'zoe',name:'Zoe',type:'women',age:'young',slot:5},
{id:'aria',name:'Aria',type:'women',age:'young',slot:6},
{id:'leo',name:'Leo',type:'men',age:'young',slot:7},
{id:'sofia',name:'Sofia',type:'women',age:'young',slot:8},
{id:'kai',name:'Kai',type:'men',age:'adult',slot:9},
{id:'ren',name:'Ren',type:'men',age:'young',slot:10},
{id:'nia',name:'Nia',type:'women',age:'adult',slot:11},
{id:'victor',name:'Victor',type:'men',age:'older',slot:12},
{id:'layla',name:'Layla',type:'women',age:'adult',slot:13},
{id:'omar',name:'Omar',type:'men',age:'adult',slot:14},
{id:'hana',name:'Hana',type:'women',age:'older',slot:15}
];

const labels = () => document.documentElement.lang === 'ar' ? {
  title:'مكتبة الشخصيات', hint:'اختر شخصية جاهزة لاستخدامها في قصتك، أو أضف شخصياتك الخاصة.',
  search:'ابحث عن شخصية...', all:'الكل', men:'رجال', women:'نساء', young:'شباب', older:'كبار السن',
  selected:'الشخصيات المحددة', use:'استخدام الشخصيات المحددة', add:'إضافة شخصية خاصة',
  empty:'لا توجد نتائج مطابقة لبحثك.', saved:'تم تحديث الشخصيات المختارة.',
  count:'شخصية', custom:'شخصياتي', favorite:'إضافة للمفضلة', unfavorite:'إزالة من المفضلة'
} : {
  title:'Character library', hint:'Choose ready-made actors for your story, or add your own characters.',
  search:'Search characters...', all:'All', men:'Men', women:'Women', young:'Young adults', older:'Older adults',
  selected:'Selected characters', use:'Use selected characters', add:'Add custom character',
  empty:'No matching characters found.', saved:'Your character selection has been updated.',
  count:'selected', custom:'My characters', favorite:'Add to favorites', unfavorite:'Remove from favorites'
};

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; } catch { return fallback; }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function compressImage(file) {
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1,640/Math.max(img.width,img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width*scale); canvas.height = Math.round(img.height*scale);
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',.78));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function mountCharacterLibrary() {
  const card = document.querySelector('.creator-card');
  const upload = card?.querySelector('#uploadZone');
  if (!card || !upload || card.querySelector('#characterLibrary')) return;

  const section = document.createElement('section');
  section.id = 'characterLibrary';
  section.className = 'character-library';
  section.style.setProperty('--portrait-sprite', 'url("' + PORTRAIT_SPRITE + '")');
  section.innerHTML = `
    <div class="character-library-top">
      <div class="character-library-title"><span class="character-library-icon">♙</span><div><span class="section-kicker">CAST YOUR STORY</span><h3></h3><p class="character-library-hint"></p></div></div>
      <span class="character-count"></span>
    </div>
    <div class="character-tools">
      <div class="character-filters" role="group" aria-label="Character filters">
        <button type="button" class="character-filter active" data-filter="all"></button>
        <button type="button" class="character-filter" data-filter="men"></button>
        <button type="button" class="character-filter" data-filter="women"></button>
        <button type="button" class="character-filter" data-filter="young"></button>
        <button type="button" class="character-filter" data-filter="older"></button>
      </div>
      <label class="character-search"><span>⌕</span><input id="characterSearch" type="search" autocomplete="off"></label>
    </div>
    <div class="character-gallery" id="characterGallery"></div>
    <div class="character-library-footer">
      <button type="button" class="character-add-button" id="characterAddButton">＋ <span></span></button>
      <input id="characterLibraryInput" type="file" accept="image/*" multiple hidden>
      <div class="character-selected-summary" id="characterSelectedSummary"></div>
      <button type="button" class="character-use-button" id="characterUseButton" disabled></button>
    </div>
    <p class="character-library-privacy"></p>
  `;
  upload.insertAdjacentElement('afterend',section);

  const input = section.querySelector('#characterLibraryInput');
  const gallery = section.querySelector('#characterGallery');
  const search = section.querySelector('#characterSearch');
  let filter = 'all';
  let selected = read(SELECTED_KEY, []);
  let favorites = read(FAVORITES_KEY, []);
  let custom = read(STORAGE_KEY, []);

  function allPeople() {
    return [...people, ...custom.map(item => ({...item,type:'custom',age:'custom'}))];
  }
  function renderGallery() {
    const t = labels();
    section.querySelector('h3').textContent = t.title;
    section.querySelector('.character-library-hint').textContent = t.hint;
    section.querySelector('.character-count').textContent = `${selected.length} / 16`;
    section.querySelector('#characterAddButton span').textContent = t.add;
    section.querySelector('#characterUseButton').textContent = t.use;
    section.querySelector('.character-library-privacy').textContent = document.documentElement.lang === 'ar'
      ? 'يمكنك اختيار أكثر من شخصية. الصور الجاهزة تُعرض من مكتبة الصور، والصور الخاصة تُحفظ في هذا المتصفح.'
      : 'Select more than one character. Ready-made portraits load from the image library; custom images stay in this browser.';
    const filters = {all:t.all,men:t.men,women:t.women,young:t.young,older:t.older};
    section.querySelectorAll('.character-filter').forEach(btn => {
      btn.textContent = filters[btn.dataset.filter];
      btn.classList.toggle('active',btn.dataset.filter===filter);
    });
    const q = search.value.trim().toLowerCase();
    const items = allPeople().filter(p => {
      const matchesFilter = filter==='all' || (filter==='young' ? p.age==='young' : filter==='older' ? p.age==='older' : p.type===filter);
      return matchesFilter && p.name.toLowerCase().includes(q);
    });
    gallery.innerHTML = items.length ? items.map(p => {
      const isSelected = selected.includes(p.id), isFav = favorites.includes(p.id);
      return `<button type="button" class="character-tile ${isSelected?'selected':''}" data-id="${escapeHtml(p.id)}" aria-pressed="${isSelected}">
        <span class="character-photo"><span class="portrait-sprite" role="img" aria-label="${escapeHtml(p.name)}" style="--portrait-position:${(p.slot%4)*33.333}% ${Math.floor(p.slot/4)*33.333}%"></span><span class="character-check">${isSelected?'−':'+'}</span></span>
        <span class="character-name">${escapeHtml(p.name)}</span>
        <span class="character-favorite" data-favorite="${escapeHtml(p.id)}" title="${isFav?t.unfavorite:t.favorite}">${isFav?'♥':'♡'}</span>
      </button>`;
    }).join('') : `<div class="character-empty">${t.empty}</div>`;
    const chosen = allPeople().filter(p => selected.includes(p.id));
    section.querySelector('#characterSelectedSummary').innerHTML = `<strong>${t.selected}: ${chosen.length}</strong><div class="selected-character-chips">${chosen.map(p=>`<button type="button" class="selected-character-chip" data-remove-character="${escapeHtml(p.id)}" aria-label="${document.documentElement.lang==='ar'?'إزالة ':'Remove '}${escapeHtml(p.name)}"><span>${escapeHtml(p.name)}</span><b>−</b></button>`).join('')}</div>`;
    section.querySelector('#characterUseButton').disabled = !chosen.length;
  }

  section.querySelectorAll('.character-filter').forEach(btn => btn.addEventListener('click',() => { filter=btn.dataset.filter; renderGallery(); }));
  section.querySelector('#characterSelectedSummary').addEventListener('click',event => {
    const remove=event.target.closest('[data-remove-character]');
    if (!remove) return;
    selected=selected.filter(id=>id!==remove.dataset.removeCharacter);
    localStorage.setItem(SELECTED_KEY,JSON.stringify(selected));
    renderGallery();
  });
  search.addEventListener('input',renderGallery);
  gallery.addEventListener('click',event => {
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
      const id=favorite.dataset.favorite;
      favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];
      localStorage.setItem(FAVORITES_KEY,JSON.stringify(favorites)); renderGallery(); return;
    }
    const tile=event.target.closest('.character-tile');
    if (!tile) return;
    const id=tile.dataset.id;
    selected=selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];
    localStorage.setItem(SELECTED_KEY,JSON.stringify(selected)); renderGallery();
  });
  section.querySelector('#characterAddButton').addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
    for (const file of [...input.files].filter(f=>f.type.startsWith('image/'))) {
      if (custom.length>=MAX_CUSTOM) { alert(document.documentElement.lang==='ar'?'يمكنك إضافة 8 صور خاصة كحد أقصى.':'You can add up to 8 custom images.'); break; }
      try {
        const image=await compressImage(file);
        const item={id:'custom-'+Date.now()+'-'+Math.random().toString(16).slice(2),name:file.name.replace(/\.[^.]+$/,'').slice(0,36)||'Custom',image};
        custom.push(item); localStorage.setItem(STORAGE_KEY,JSON.stringify(custom));
      } catch { alert(document.documentElement.lang==='ar'?'تعذرت قراءة إحدى الصور.':'Could not read one of the images.'); }
    }
    input.value=''; renderGallery();
  });
  section.querySelector('#characterUseButton').addEventListener('click',()=>{
    const chosen=allPeople().filter(p=>selected.includes(p.id));
    window.dispatchEvent(new CustomEvent('frameforge:characters-selected',{detail:{characters:chosen}}));
    const notice=document.querySelector('#notice');
    if (notice) notice.textContent=document.documentElement.lang==='ar'
      ? 'تم اختيار الشخصيات: '+chosen.map(p=>p.name).join('، ')+'. ستُستخدم كمرجع عند ربط محرك التوليد.'
      : 'Selected characters: '+chosen.map(p=>p.name).join(', ')+'. They will be used as references when a generation engine is connected.';
    section.querySelector('#characterUseButton').textContent=labels().saved;
  });
  renderGallery();
}
