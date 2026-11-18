const STORAGE_KEY = 'frameforge-character-library-v2';
const SELECTED_KEY = 'frameforge-selected-characters-v1';
const FAVORITES_KEY = 'frameforge-character-favorites-v1';
const MAX_CUSTOM = 8;

const people = [
  {id:'zara',name:'Zara',type:'women',age:'adult',image:'https://randomuser.me/api/portraits/women/44.jpg'},
  {id:'mei',name:'Mei',type:'women',age:'young',image:'https://randomuser.me/api/portraits/women/68.jpg'},
  {id:'james',name:'James',type:'men',age:'adult',image:'https://randomuser.me/api/portraits/men/32.jpg'},
  {id:'priya',name:'Priya',type:'women',age:'adult',image:'https://randomuser.me/api/portraits/women/32.jpg'},
  {id:'mason',name:'Mason',type:'men',age:'young',image:'https://randomuser.me/api/portraits/men/75.jpg'},
  {id:'zoe',name:'Zoe',type:'women',age:'young',image:'https://randomuser.me/api/portraits/women/23.jpg'},
  {id:'aria',name:'Aria',type:'women',age:'young',image:'https://randomuser.me/api/portraits/women/50.jpg'},
  {id:'leo',name:'Leo',type:'men',age:'adult',image:'https://randomuser.me/api/portraits/men/18.jpg'},
  {id:'sofia',name:'Sofia',type:'women',age:'adult',image:'https://randomuser.me/api/portraits/women/65.jpg'},
  {id:'kai',name:'Kai',type:'men',age:'young',image:'https://randomuser.me/api/portraits/men/22.jpg'},
  {id:'ren',name:'Ren',type:'men',age:'young',image:'https://randomuser.me/api/portraits/men/12.jpg'},
  {id:'nia',name:'Nia',type:'women',age:'young',image:'https://randomuser.me/api/portraits/women/12.jpg'},
  {id:'victor',name:'Victor',type:'men',age:'older',image:'https://randomuser.me/api/portraits/men/68.jpg'},
  {id:'layla',name:'Layla',type:'women',age:'adult',image:'https://randomuser.me/api/portraits/women/54.jpg'},
  {id:'omar',name:'Omar',type:'men',age:'adult',image:'https://randomuser.me/api/portraits/men/29.jpg'},
  {id:'hana',name:'Hana',type:'women',age:'adult',image:'https://randomuser.me/api/portraits/women/12.jpg'}
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
        <span class="character-photo"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"><span class="character-check">${isSelected?'✓':''}</span></span>
        <span class="character-name">${escapeHtml(p.name)}</span>
        <span class="character-favorite" data-favorite="${escapeHtml(p.id)}" title="${isFav?t.unfavorite:t.favorite}">${isFav?'♥':'♡'}</span>
      </button>`;
    }).join('') : `<div class="character-empty">${t.empty}</div>`;
    const chosen = allPeople().filter(p => selected.includes(p.id));
    section.querySelector('#characterSelectedSummary').innerHTML = `<strong>${t.selected}: ${chosen.length}</strong><span>${chosen.map(p=>escapeHtml(p.name)).join('، ')}</span>`;
    section.querySelector('#characterUseButton').disabled = !chosen.length;
  }

  section.querySelectorAll('.character-filter').forEach(btn => btn.addEventListener('click',() => { filter=btn.dataset.filter; renderGallery(); }));
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
