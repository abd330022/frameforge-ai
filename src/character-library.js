const STORAGE_KEY = 'frameforge-character-library-v1';
const MAX_CHARACTERS = 8;
const MAX_IMAGE_SIDE = 720;

const labels = () => document.documentElement.lang === 'ar'
  ? { title: 'مكتبة الشخصيات', hint: 'احفظ صوراً مرجعية لشخصيات قصتك على هذا الجهاز، واختر الشخصية التي تريد العمل عليها.', add: 'إضافة صور شخصيات', active: 'الشخصية النشطة', empty: 'لم تحفظ أي شخصية بعد. أضف صورة واضحة للشخصية.', saved: 'تم حفظ الشخصية في هذا الجهاز.', limit: 'يمكن حفظ 8 شخصيات كحد أقصى.', remove: 'حذف', use: 'اختيار', selected: 'محددة', name: 'اسم الشخصية', privacy: 'الصور تبقى في متصفحك على هذا الجهاز ولا تُرفع إلى خادم.' }
  : { title: 'Character library', hint: 'Save visual references for your story characters on this device, then choose the character you want to work with.', add: 'Add character images', active: 'Active character', empty: 'No characters saved yet. Add a clear image of a character.', saved: 'Character saved on this device.', limit: 'You can save up to 8 characters.', remove: 'Remove', use: 'Select', selected: 'Selected', name: 'Character name', privacy: 'Images stay in this browser on this device and are not uploaded to a server.' };

function readLibrary() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function mountLibrary() {
  const card = document.querySelector('.creator-card');
  const upload = card?.querySelector('#uploadZone');
  if (!card || !upload || card.querySelector('#characterLibrary')) return;

  const section = document.createElement('section');
  section.id = 'characterLibrary';
  section.className = 'character-library';
  section.innerHTML = `
    <div class="character-library-heading"><div><span class="section-kicker">CHARACTER CONSISTENCY</span><h3>${labels().title}</h3></div><span class="character-count"></span></div>
    <p class="character-library-hint"></p>
    <input id="characterLibraryInput" type="file" accept="image/*" multiple hidden>
    <button type="button" class="character-add-button" id="characterAddButton">＋ <span></span></button>
    <div class="character-gallery" id="characterGallery"></div>
    <p class="character-library-privacy"></p>
  `;
  upload.insertAdjacentElement('afterend', section);

  const style = document.createElement('style');
  style.textContent = `
    .character-library{margin:22px 0;padding:20px;border:1px solid rgba(160,130,255,.24);border-radius:18px;background:rgba(120,90,210,.055)}
    .character-library-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .character-library-heading h3{margin:5px 0;font-size:19px}
    .character-library-hint,.character-library-privacy{color:var(--muted,#999);font-size:13px;line-height:1.7}
    .character-add-button{border:1px dashed #9472ee;background:rgba(145,110,240,.10);color:inherit;border-radius:12px;padding:12px 16px;cursor:pointer;font:inherit;width:100%;text-align:center}
    .character-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:16px}
    .character-item{min-width:0;border:1px solid rgba(160,130,255,.2);border-radius:13px;padding:9px;background:rgba(20,18,32,.45)}
    .character-item.active{border-color:#a58aff;box-shadow:0 0 0 1px #a58aff}
    .character-item img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:9px;display:block}
    .character-item input{width:100%;box-sizing:border-box;margin:8px 0 6px;padding:7px;border-radius:7px;border:1px solid #555;background:transparent;color:inherit}
    .character-item-actions{display:flex;gap:6px}
    .character-item-actions button{flex:1;padding:6px 4px;border-radius:7px;border:1px solid #66558e;background:transparent;color:inherit;cursor:pointer;font-size:12px}
    .character-empty{grid-column:1/-1;padding:16px;border:1px dashed rgba(160,130,255,.25);border-radius:10px;text-align:center;color:var(--muted,#999);font-size:13px}
    .character-count{font-size:12px;color:var(--muted,#999)}
  `;
  document.head.append(style);

  const input = section.querySelector('#characterLibraryInput');
  const gallery = section.querySelector('#characterGallery');
  let activeId = null;

  function renderGallery() {
    const text = labels();
    const items = readLibrary();
    section.querySelector('h3').textContent = text.title;
    section.querySelector('.character-library-hint').textContent = text.hint;
    section.querySelector('.character-library-privacy').textContent = text.privacy;
    section.querySelector('#characterAddButton span').textContent = text.add;
    section.querySelector('.character-count').textContent = `${items.length}/${MAX_CHARACTERS}`;
    if (!items.length) {
      gallery.innerHTML = `<div class="character-empty">${text.empty}</div>`;
      return;
    }
    gallery.innerHTML = items.map(item => `
      <article class="character-item ${item.id === activeId ? 'active' : ''}" data-id="${item.id}">
        <img src="${item.image}" alt="">
        <input aria-label="${text.name}" value="${escapeHtml(item.name)}" maxlength="40">
        <div class="character-item-actions">
          <button type="button" data-action="select">${item.id === activeId ? text.selected : text.use}</button>
          <button type="button" data-action="remove">${text.remove}</button>
        </div>
      </article>`).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  section.querySelector('#characterAddButton').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const files = [...input.files].filter(file => file.type.startsWith('image/'));
    let items = readLibrary();
    for (const file of files) {
      if (items.length >= MAX_CHARACTERS) { alert(labels().limit); break; }
      try {
        const image = await compressImage(file);
        const item = { id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()), name: file.name.replace(/\.[^.]+$/, '').slice(0,40) || 'Character', image };
        items.push(item);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        if (!activeId) activeId = item.id;
      } catch {
        alert(document.documentElement.lang === 'ar' ? 'تعذر قراءة إحدى الصور. جرّب صورة أخرى.' : 'Could not read one of the images. Try another image.');
      }
    }
    input.value = '';
    renderGallery();
  });

  gallery.addEventListener('input', event => {
    if (!event.target.matches('input')) return;
    const item = event.target.closest('.character-item');
    const items = readLibrary();
    const found = items.find(entry => entry.id === item.dataset.id);
    if (found) {
      found.name = event.target.value.slice(0,40);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  });

  gallery.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const item = button.closest('.character-item');
    const items = readLibrary();
    if (button.dataset.action === 'remove') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.filter(entry => entry.id !== item.dataset.id)));
      if (activeId === item.dataset.id) activeId = null;
    } else {
      activeId = item.dataset.id;
    }
    renderGallery();
  });

  renderGallery();
  window.addEventListener('storage', renderGallery);
}

const observer = new MutationObserver(() => mountLibrary());
observer.observe(document.documentElement, { childList: true, subtree: true });
mountLibrary();
