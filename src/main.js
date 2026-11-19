import './style.css'

const VIDEO_DB_NAME = 'frameforge-workspace'
const VIDEO_STORE_NAME = 'videos'
function openVideoDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VIDEO_DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(VIDEO_STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function saveWorkspaceVideo(file) {
  const db = await openVideoDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite')
    tx.objectStore(VIDEO_STORE_NAME).put({ blob: file, name: file.name, type: file.type, savedAt: Date.now() }, 'latest')
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
async function loadWorkspaceVideo() {
  const db = await openVideoDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE_NAME, 'readonly')
    const request = tx.objectStore(VIDEO_STORE_NAME).get('latest')
    request.onsuccess = () => { db.close(); resolve(request.result || null) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

import { mountCharacterLibrary } from './character-library.js'
import { mountStoryPlanner } from './story-planner.js'
import { Client, handle_file } from '@gradio/client'
import { mountHuggingFaceConnect, getHuggingFaceAccessToken } from './huggingface-auth.js'

const copy = {
  ar: {
    navCreate: 'إنشاء فيديو', navExplore: 'استكشف', signIn: 'ربط الحساب',
    badge: 'استوديو صناعة الفيديو بالذكاء الاصطناعي',
    titleA: 'حوّل خيالك', titleB: 'إلى مشهد ينبض بالحياة',
    subtitle: 'ابدأ بفكرة أو صورة أو قصة. اصنع فيديوهاتك الإبداعية من مكان واحد.',
    promptLabel: 'صف الفيديو الذي تتخيله', placeholder: 'مثال: فارس عربي يمتطي حصاناً في صحراء ذهبية وقت الغروب، لقطة سينمائية...',
    textMode: 'من نص', imageMode: 'من صورة', storyMode: 'من قصة',
    upload: 'أضف صورة مرجعية', uploadHint: 'اسحب الصورة هنا أو اضغط للاختيار',
    motion: 'وصف الحركة المطلوبة', motionHint: 'مثال: يمشي البطل نحو الباب ويفتحه، ثم تقترب الكاميرا منه ببطء...',
    voiceLanguage: 'لغة الصوت', voiceArabic: 'العربية', voiceEnglish: 'الإنجليزية', voiceAccent: 'اللهجة / اللكنة', accentMsa: 'العربية الفصحى', accentLevant: 'الشامية', accentEgypt: 'المصرية', accentGulf: 'الخليجية', accentUS: 'الإنجليزية الأمريكية', accentUK: 'الإنجليزية البريطانية',
    voiceType: 'نوع الصوت', voiceFemale: 'صوت نسائي', voiceMale: 'صوت رجالي',
    voiceCharacterMode: 'صوت الشخصيات', voiceOff: 'بدون صوت للشخصيات (حركة فقط)', voiceOn: 'الشخصيات تتحدث', voiceCharacter: 'صوت الشخصية', voiceChildBoy: 'ولد صغير', voiceChildGirl: 'بنت صغيرة', voiceYoungMan: 'شاب', voiceYoungWoman: 'فتاة شابة', voiceAdultMan: 'رجل بالغ', voiceAdultWoman: 'امرأة بالغة', voiceOldMan: 'رجل كبير في السن', voiceOldWoman: 'امرأة كبيرة في السن', voiceCartoon: 'صوت كرتوني',
    soundTitle: 'الأصوات والمؤثرات', autoSounds: 'اقترح الأصوات تلقائياً من القصة', autoSoundsHint: 'سيحلل النظام المشاهد ويقترح أصوات الشخصيات والحيوانات والمؤثرات، ويمكنك تعديلها.',
    soundEffects: 'المؤثرات الصوتية', soundEffectsHint: 'مثل اصطدام، سقوط، تحطم زجاج، خطوات، مطر ورعد', animalSounds: 'أصوات الحيوانات', animalSoundsHint: 'مثل كلب، قطة، حصان، أسد وطيور',
    saveCharacter: 'حفظ الصورة كشخصية مرجعية على هذا الجهاز',
    characterNote: 'إعدادات الصوت هنا لتجهيز اختياراتك؛ تشغيل الأصوات وتوليدها يحتاجان إلى ربط محرك صوت.',
    duration: 'المدة', style: 'النمط البصري', ratio: 'الأبعاد',
    seconds: 'ثوانٍ', cinematic: 'سينمائي', anime: 'أنمي', realistic: 'واقعي', cartoon: 'كرتوني',
    generate: 'إنشاء الفيديو', free: 'تجربة مجانية — تستخدم حصة Hugging Face',
    ideas: 'أفكار تلهمك', idea1: 'مدينة مستقبلية تحت المطر', idea2: 'مغامرة كرتونية في الغابة', idea3: 'إعلان سينمائي لمنتجك',
    how: 'من الفكرة إلى الفيديو بثلاث خطوات', step1: 'اكتب فكرتك', step1d: 'صف المشهد الذي تريد رؤيته ببساطة.', step2: 'اختر أسلوبك', step2d: 'حدد النمط والمدة والأبعاد المناسبة.', step3: 'أنشئ وشارك', step3d: 'راجع النتيجة وجهّزها للمشاركة.',
    footer: 'مساحة إبداعك تبدأ من هنا.', demoTitle: 'معلومة عن التوليد', demoText: 'لإنشاء فيديو قصير وربط الاستخدام بحصتك، سيرسل الموقع وصفك والصورة التي تختارها ورمز وصول Hugging Face إلى مساحة عامة يديرها Upsampler على Hugging Face.',
    alertPrompt: 'اكتب وصفاً للفيديو أولاً.', alertDemo: 'تعذّر إنشاء الفيديو. قد تكون مساحة التوليد مشغولة أو انتهت حصة ZeroGPU اليومية. حاول لاحقاً.',
    language: 'English'
  },
  en: {
    navCreate: 'Create video', navExplore: 'Explore', signIn: 'Connect account',
    badge: 'AI video creation studio',
    titleA: 'Turn your imagination', titleB: 'into a living scene',
    subtitle: 'Start with an idea, an image, or a story. Create your videos in one place.',
    promptLabel: 'Describe the video you imagine', placeholder: 'Example: An Arabian horseman crossing golden dunes at sunset, cinematic camera movement...',
    textMode: 'Text to video', imageMode: 'Image to video', storyMode: 'Story to video',
    upload: 'Add a reference image', uploadHint: 'Drop an image here or click to browse',
    motion: 'Describe the motion', motionHint: 'Example: the hero walks to the door and opens it, then the camera slowly moves closer...',
    voiceLanguage: 'Voice language', voiceArabic: 'Arabic', voiceEnglish: 'English', voiceAccent: 'Dialect / accent', accentMsa: 'Modern Standard Arabic', accentLevant: 'Levantine Arabic', accentEgypt: 'Egyptian Arabic', accentGulf: 'Gulf Arabic', accentUS: 'American English', accentUK: 'British English',
    voiceType: 'Voice type', voiceFemale: 'Female voice', voiceMale: 'Male voice',
    voiceCharacterMode: 'Character audio', voiceOff: 'No character voice (motion only)', voiceOn: 'Characters speak', voiceCharacter: 'Character voice', voiceChildBoy: 'Young boy', voiceChildGirl: 'Young girl', voiceYoungMan: 'Young man', voiceYoungWoman: 'Young woman', voiceAdultMan: 'Adult man', voiceAdultWoman: 'Adult woman', voiceOldMan: 'Older man', voiceOldWoman: 'Older woman', voiceCartoon: 'Cartoon voice',
    soundTitle: 'Sounds and effects', autoSounds: 'Suggest sounds automatically from the story', autoSoundsHint: 'The system will analyze scenes and suggest character voices, animal sounds and effects. You can edit them.',
    soundEffects: 'Sound effects', soundEffectsHint: 'Such as collision, fall, breaking glass, footsteps, rain and thunder', animalSounds: 'Animal sounds', animalSoundsHint: 'Such as dog, cat, horse, lion and birds',
    saveCharacter: 'Save image as a character reference on this device',
    characterNote: 'These voice settings prepare your choices; playing and generating audio requires a connected audio engine.',
    duration: 'Duration', style: 'Visual style', ratio: 'Aspect ratio',
    seconds: 'seconds', cinematic: 'Cinematic', anime: 'Anime', realistic: 'Realistic', cartoon: 'Cartoon',
    generate: 'Create video', free: 'Free trial — uses Hugging Face quota',
    ideas: 'Ideas to inspire you', idea1: 'A futuristic city in the rain', idea2: 'A cartoon adventure in the forest', idea3: 'A cinematic product commercial',
    how: 'From idea to video in three steps', step1: 'Write your idea', step1d: 'Describe the scene you want to see.', step2: 'Choose your style', step2d: 'Set the visual style, duration and ratio.', step3: 'Create and share', step3d: 'Review your result and get it ready to share.',
    footer: 'Your creative space starts here.', demoTitle: 'About generation', demoText: 'To create a short video and associate usage with your quota, the site sends your prompt, selected image, and Hugging Face access token to Upsampler’s public Hugging Face Space.',
    alertPrompt: 'Please describe your video first.', alertDemo: 'Video generation failed. The shared Space may be busy or your daily ZeroGPU quota may be used up. Please try again later.',
    language: 'العربية'
  }
}

let lang = 'ar'
let mode = 'text'
let selectedImage = null
let selectedImageData = null
const t = key => copy[lang][key]
const VIDEO_SPACE = 'Upsampler/wan-2-2-5b-video';
const VIDEO_SPACE_URL = 'https://upsampler-wan-2-2-5b-video.hf.space';
function getVideoFileUrl(output) {
  const candidate = output?.video?.url || output?.url || output?.video?.path || output?.path || output?.video || output;
  if (typeof candidate !== 'string' || !candidate) return null;
  if (/^(https?:|blob:|data:)/i.test(candidate)) return candidate;
  if (candidate.startsWith('/gradio_api/file=') || candidate.startsWith('/file=')) {
    return new URL(candidate, VIDEO_SPACE_URL).toString();
  }
  return new URL('/gradio_api/file=' + encodeURIComponent(candidate), VIDEO_SPACE_URL).toString();
}
const app = document.querySelector('#app')

function render() {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  app.innerHTML = `
    <aside class="side-nav"><a class="brand side-brand" href="#home"><span class="brand-mark">F</span><span>FrameForge <i>AI</i></span></a><div class="side-caption">مساحة العمل</div><nav class="side-links"><a href="#home">⌂　الرئيسية</a><a class="side-active" href="#create">✦　إنشاء الفيديو</a><a href="#ideas">◈　استكشاف</a><a href="#create">▤　مشاريعي</a><a href="#characterLibrary">♙　مكتبة الشخصيات</a></nav><div class="side-bottom"><a href="#create">⚙　الإعدادات</a><a href="#how">؟　المساعدة</a></div></aside>
    <header class="topbar">
      <a class="brand" href="#" aria-label="FrameForge AI home"><span class="brand-mark">F</span><span>FrameForge <i>AI</i></span></a>
      <nav><a href="#create">${t('navCreate')}</a><a href="#how">${t('navExplore')}</a></nav>
      <div class="top-actions"><button class="lang-btn" id="langBtn">${t('language')}</button><a class="signin" href="#huggingFaceConnect">${t('signIn')}</a></div>
    </header>
    <main>
      <section class="hero" id="home">
        <div class="orb orb-one"></div><div class="orb orb-two"></div>
        <div class="hero-copy">
          <div class="eyebrow"><span class="spark">✦</span>${t('badge')}</div>
          <h1>${t('titleA')}<br><span>${t('titleB')}</span></h1>
          <p class="subhead">${t('subtitle')}</p>
          <a class="primary-link" href="#create">${t('navCreate')} <span>↘</span></a>
          <div class="trust"><span class="avatars"><b>A</b><b>✦</b><b>F</b></span><span>Creative ideas, made visual</span></div>
        </div>
        <div class="hero-art" aria-label="Abstract cinematic artwork">
          <div class="art-frame"><div class="sun"></div><div class="mountain m1"></div><div class="mountain m2"></div><div class="art-grid"></div><div class="art-caption"><span>FRAME / 001</span><span>IMAGINE MORE</span></div></div>
          <div class="floating-chip chip-top">✧ <span>AI creativity</span></div><div class="floating-chip chip-bottom"><span class="pulse"></span> Create something new</div>
        </div>
      </section>
      <section class="creator-section" id="create">
        <div class="section-heading"><div><span class="section-kicker">01 / CREATE</span><h2>${t('navCreate')}</h2></div><span class="free-tag">✦ ${t('free')}</span></div>
        <div class="creator-card">
          <div class="mode-tabs">
            <button class="mode-tab ${mode==='text'?'active':''}" data-mode="text">✎ ${t('textMode')}</button>
            <button class="mode-tab ${mode==='image'?'active':''}" data-mode="image">▧ ${t('imageMode')}</button>
            <button class="mode-tab ${mode==='story'?'active':''}" data-mode="story">▤ ${t('storyMode')}</button>
          </div>
          <label class="field-label" for="prompt">${t('promptLabel')}</label>
          <textarea id="prompt" rows="4" placeholder="${t('placeholder')}"></textarea>
          <div class="upload-zone ${selectedImage?'has-image':''}" id="uploadZone">
            <input type="file" id="imageInput" accept="image/*" hidden />
            <div class="upload-icon">＋</div><div><strong>${selectedImage ? selectedImage : t('upload')}</strong><small>${t('uploadHint')}</small></div><button class="browse-btn" id="browseBtn">+</button>
          </div>
          <div class="extra-controls">
            <label class="field-label" for="motionPrompt">${t('motion')}</label>
            <textarea id="motionPrompt" rows="2" placeholder="${t('motionHint')}"></textarea>
            <div class="setting"><label for="characterAudioMode">${t("voiceCharacterMode")}</label><select id="characterAudioMode"><option value="off">${t("voiceOff")}</option><option value="on">${t("voiceOn")}</option></select></div>
            <div class="setting"><label for="voiceAccent">${t("voiceAccent")}</label><select id="voiceAccent"><option value="msa">${t("accentMsa")}</option><option value="levant">${t("accentLevant")}</option><option value="egypt">${t("accentEgypt")}</option><option value="gulf">${t("accentGulf")}</option><option value="us">${t("accentUS")}</option><option value="uk">${t("accentUK")}</option></select></div>
            <div class="settings-grid voice-grid">
              <div class="setting"><label for="voiceLanguage">${t('voiceLanguage')}</label><select id="voiceLanguage"><option value="ar">${t('voiceArabic')}</option><option value="en">${t('voiceEnglish')}</option></select></div>
              <div class="setting"><label for="voiceCharacter">${t('voiceCharacter')}</label><select id="voiceCharacter">
                <option>${t('voiceChildBoy')}</option><option>${t('voiceChildGirl')}</option><option>${t('voiceYoungMan')}</option><option>${t('voiceYoungWoman')}</option><option>${t('voiceAdultMan')}</option><option>${t('voiceAdultWoman')}</option><option>${t('voiceOldMan')}</option><option>${t('voiceOldWoman')}</option><option>${t('voiceCartoon')}</option>
              </select></div>
            </div>
            <section class="sound-panel">
              <h3>${t('soundTitle')}</h3>
              <label class="save-character"><input type="checkbox" id="autoSounds" checked /> ${t('autoSounds')}</label>
              <p class="notice">${t('autoSoundsHint')}</p>
              <div class="settings-grid">
                <div class="setting"><label for="animalSounds">${t('animalSounds')}</label><input id="animalSounds" type="text" placeholder="${t('animalSoundsHint')}" /></div>
                <div class="setting"><label for="soundEffects">${t('soundEffects')}</label><input id="soundEffects" type="text" placeholder="${t('soundEffectsHint')}" /></div>
              </div>
            </section>
            <label class="save-character"><input type="checkbox" id="saveCharacter" /> ${t('saveCharacter')}</label>
            <p class="notice">${t('characterNote')}</p>
          </div>
          <div class="settings-grid">
            <div class="setting"><label for="duration">${t('duration')}</label><select id="duration"><option value="2">2 ${t('seconds')}</option></select></div>
            <div class="setting"><label for="style">${t('style')}</label><select id="style"><option value="cinematic">${t('cinematic')}</option><option value="realistic">${t('realistic')}</option><option value="anime">${t('anime')}</option><option value="cartoon">${t('cartoon')}</option></select></div>
            <div class="setting"><label for="ratio">${t('ratio')}</label><select id="ratio"><option>16:9</option><option>9:16</option><option>1:1</option></select></div>
          </div>
          <section class="hf-connect-card" id="huggingFaceConnect" aria-labelledby="hfConnectTitle">
            <div class="hf-connect-copy">
              <span class="hf-connect-kicker">HUGGING FACE</span>
              <h3 id="hfConnectTitle">${lang === 'ar' ? 'اربط حسابك من داخل FrameForge' : 'Connect your account from FrameForge'}</h3>
              <p>${lang === 'ar' ? 'تسجيل الدخول يتم لدى Hugging Face. قبل كل إنشاء، اختر الموافقة على إرسال الوصف والصورة ورمز الوصول إلى مساحة عامة يديرها Upsampler لتوليد الفيديو وربط الاستخدام بحسابك. تُستخدم حصة ZeroGPU، وقد يتغير وقت الانتظار أو توفر المساحة.' : 'Sign-in happens on Hugging Face. Before each generation, choose to send your prompt, image, and access token to Upsampler’s public Hugging Face Space to create the video and associate usage with your account. Your ZeroGPU quota is used, and wait times or availability may change.'}</p>
            </div>
            <div class="hf-connect-actions">
              <button class="hf-connect-btn" id="hfConnectBtn" type="button">${lang === 'ar' ? '🤗 ربط حساب Hugging Face' : '🤗 Connect Hugging Face'}</button>
              <button class="hf-disconnect-btn" id="hfDisconnectBtn" type="button" hidden>${lang === 'ar' ? 'فصل الحساب' : 'Disconnect'}</button>
            </div>
            <span id="hfConnectedAccount" hidden></span>
            <p class="notice" id="hfConnectStatus" role="status" aria-live="polite"></p>
          </section>
          <label class="hf-video-consent">
            <input id="hfVideoConsent" type="checkbox" />
            <span>${lang === 'ar' ? 'أوافق على إرسال وصفي والصورة (إن وُجدت) ورمز وصول Hugging Face إلى مساحة عامة يديرها Upsampler لإنشاء الفيديو وربط الاستخدام بحصة حسابي. قد تُستخدم أرصدة مدفوعة بعد انتهاء الحصة المجانية.' : 'I agree to send my prompt, image (if any), and Hugging Face access token to Upsampler’s public Hugging Face Space to create the video and associate usage with my account quota. Paid credits may be used after the free quota is exhausted.'}</span>
          </label>
          <p class="hf-video-disclosure">${lang === 'ar' ? 'المحرك الحالي ينشئ مقطعاً واحداً مدته نحو ثانيتين. قد يستغرق التوليد والانتظار عدة دقائق.' : 'The current engine creates one video around 2 seconds long. Generation and queueing can take several minutes.'}</p>
          <button class="generate-btn" id="generateBtn"><span>✦</span>${t('generate')} <b>↗</b></button>
          <p class="notice" id="notice">✧ ${t('demoText')}</p>
          <div class="generated-video-panel" id="generatedVideoPanel" hidden>
            <h3>${lang === 'ar' ? 'الفيديو الذي أنشأته' : 'Your generated video'}</h3>
            <video id="generatedVideo" controls playsinline></video>
            <a class="generated-video-link" id="generatedVideoLink" target="_blank" rel="noopener noreferrer">${lang === 'ar' ? 'فتح الفيديو أو تنزيله' : 'Open or download video'}</a>
          </div>

          <div class="import-video-panel">
            <h3>${lang === 'ar' ? 'إضافة فيديو جاهز' : 'Add an existing video'}</h3>
            <p>${lang === 'ar' ? 'ارفع فيديو MP4 من جهازك لعرضه داخل مساحة العمل.' : 'Upload an MP4 video from your device to preview it in your workspace.'}</p>
            <label class="import-video-button" for="existingVideoInput">${lang === 'ar' ? 'اختيار فيديو من الجهاز' : 'Choose video from device'}</label>
            <input id="existingVideoInput" type="file" accept="video/mp4,video/webm,video/quicktime" hidden>
            <div id="existingVideoStatus" class="notice"></div>
            <button id="saveExistingVideo" class="save-video-button" type="button" hidden>حفظ الفيديو في مشاريعي على هذا الجهاز</button>
            <video id="existingVideoPreview" controls playsinline hidden></video>
          </div>
        </div>
      </section>
      <section class="ideas-section" id="ideas">
        <div class="section-heading"><div><span class="section-kicker">02 / INSPIRE</span><h2>${t('ideas')}</h2></div></div>
        <div class="idea-grid">
          <button class="idea-card idea-a" data-idea="idea1"><span class="idea-number">01</span><strong>${t('idea1')}</strong><span class="idea-arrow">↗</span></button>
          <button class="idea-card idea-b" data-idea="idea2"><span class="idea-number">02</span><strong>${t('idea2')}</strong><span class="idea-arrow">↗</span></button>
          <button class="idea-card idea-c" data-idea="idea3"><span class="idea-number">03</span><strong>${t('idea3')}</strong><span class="idea-arrow">↗</span></button>
        </div>
      </section>
      <section class="how-section" id="how"><span class="section-kicker">03 / HOW IT WORKS</span><h2>${t('how')}</h2><div class="steps">
        <article><span>01</span><h3>${t('step1')}</h3><p>${t('step1d')}</p></article>
        <article><span>02</span><h3>${t('step2')}</h3><p>${t('step2d')}</p></article>
        <article><span>03</span><h3>${t('step3')}</h3><p>${t('step3d')}</p></article>
      </div></section>
    </main>
    <footer><a class="brand" href="#"><span class="brand-mark">F</span><span>FrameForge <i>AI</i></span></a><p>${t('footer')}</p><span>© 2026 FRAMEFORGE AI</span></footer>
    <div class="toast" id="toast" role="status"></div>
  `
  mountCharacterLibrary()
  mountStoryPlanner()
  mountHuggingFaceConnect(lang)
  document.querySelector('#langBtn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; render() })
  const voiceLanguage = document.querySelector('#voiceLanguage')
  const voiceAccent = document.querySelector('#voiceAccent')
  const updateAccentOptions = () => {
    const choices = voiceLanguage.value === 'ar'
      ? [['msa', t('accentMsa')], ['levant', t('accentLevant')], ['egypt', t('accentEgypt')], ['gulf', t('accentGulf')]]
      : [['us', t('accentUS')], ['uk', t('accentUK')]]
    voiceAccent.innerHTML = choices.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')
  }
  voiceLanguage.addEventListener('change', updateAccentOptions)
  updateAccentOptions()
  document.querySelectorAll('.mode-tab').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; render() }))
  document.querySelectorAll('.idea-card').forEach(b => b.addEventListener('click', () => { document.querySelector('#prompt').value = t(b.dataset.idea); document.querySelector('#create').scrollIntoView({behavior:'smooth'}) }))
  document.querySelector('#browseBtn').addEventListener('click', () => document.querySelector('#imageInput').click())
  document.querySelector('#uploadZone').addEventListener('click', e => { if(e.target.id !== 'browseBtn') document.querySelector('#imageInput').click() })
  document.querySelector('#imageInput').addEventListener('change', e => {
    const file=e.target.files[0]
    if(file) {
      selectedImage=file.name
      const reader=new FileReader()
      reader.onload=()=>{ selectedImageData=reader.result; document.querySelector('.upload-zone strong').textContent=selectedImage; const preview=document.createElement('img'); preview.src=selectedImageData; preview.className='image-preview'; preview.alt='Selected reference'; document.querySelector('#uploadZone').prepend(preview); const icon=document.querySelector('.upload-icon'); if(icon) icon.remove() }
      reader.readAsDataURL(file)
    }
  })
  document.querySelector('#saveCharacter').addEventListener('change', e => {
    if(e.target.checked && selectedImageData) {
      try { localStorage.setItem('frameforge-character', JSON.stringify({name:selectedImage,data:selectedImageData})) } catch(err) {}
      const note=document.querySelector('.extra-controls .notice:last-child')
      note.textContent=lang==='ar'?'تم حفظ مرجع الصورة على هذا الجهاز.':'Image reference saved on this device.'
    } else if(e.target.checked) {
      e.target.checked=false
      const note=document.querySelector('.extra-controls .notice:last-child')
      note.textContent=lang==='ar'?'ارفع صورة أولاً ثم احفظها.':'Upload an image first, then save it.'
    }
  })
  let importedVideoUrl = null
  const videoInput = document.querySelector('#existingVideoInput')
  const videoPreview = document.querySelector('#existingVideoPreview')
  const videoStatus = document.querySelector('#existingVideoStatus')
  const saveVideoButton = document.querySelector('#saveExistingVideo')
  const showWorkspaceVideo = (blob, name) => {
    if (importedVideoUrl) URL.revokeObjectURL(importedVideoUrl)
    importedVideoUrl = URL.createObjectURL(blob)
    videoPreview.src = importedVideoUrl
    videoPreview.hidden = false
    saveVideoButton.hidden = false
    videoStatus.textContent = 'الفيديو جاهز: ' + name
  }
  videoInput.addEventListener('change', event => {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    if (!file.type.startsWith('video/')) { videoStatus.textContent = 'الملف المحدد ليس فيديو.'; return }
    showWorkspaceVideo(file, file.name)
  })
  saveVideoButton.addEventListener('click', async () => {
    saveVideoButton.disabled = true
    try {
      const file = videoInput.files && videoInput.files[0]
      if (!file) throw new Error('NO_VIDEO')
      await saveWorkspaceVideo(file)
      videoStatus.textContent = 'تم حفظ الفيديو في مشاريعي على هذا الجهاز.'
    } catch (error) {
      videoStatus.textContent = 'تعذّر الحفظ. قد تكون مساحة التخزين غير كافية.'
    } finally { saveVideoButton.disabled = false }
  })
  loadWorkspaceVideo().then(saved => { if (saved && saved.blob) showWorkspaceVideo(saved.blob, saved.name || 'saved-video') }).catch(() => {})
  document.querySelector('#generateBtn').addEventListener('click', async () => {
    const prompt = document.querySelector('#prompt').value.trim()
    const toast = document.querySelector('#toast')
    const button = document.querySelector('#generateBtn')
    const consent = document.querySelector('#hfVideoConsent')
    const videoPanel = document.querySelector('#generatedVideoPanel')
    const video = document.querySelector('#generatedVideo')
    const videoLink = document.querySelector('#generatedVideoLink')
    const showToast = message => {
      toast.textContent = message
      toast.classList.add('show')
    }
    const setProgress = message => {
      document.querySelector('#notice').textContent = '✧ ' + message
      showToast(message)
    }

    if (!prompt) {
      showToast(t('alertPrompt'))
      return
    }
    if (!getHuggingFaceAccessToken()) {
      showToast(lang === 'ar' ? 'اربط حساب Hugging Face أولاً.' : 'Connect your Hugging Face account first.')
      document.querySelector('#huggingFaceConnect').scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!consent.checked) {
      showToast(lang === 'ar' ? 'وافق على إرسال الوصف والصورة قبل البدء.' : 'Please consent to sending the prompt and image before generating.')
      consent.focus()
      return
    }
    if (mode === 'image' && !selectedImageData) {
      showToast(lang === 'ar' ? 'أضف صورة مرجعية أولاً.' : 'Add a reference image first.')
      return
    }

    button.disabled = true
    button.style.opacity = '.65'
    videoPanel.hidden = true
    video.pause()
    video.removeAttribute('src')
    video.load()

    try {
      const token = getHuggingFaceAccessToken()
      const client = await Client.connect(VIDEO_SPACE, {
        token,
        events: ['data', 'status']
      })
      const stylePrompts = {
        cinematic: 'cinematic composition, dramatic lighting, smooth camera movement',
        realistic: 'photorealistic details, natural lighting, realistic motion',
        anime: 'anime style, expressive motion, richly colored animation',
        cartoon: 'stylized 3D cartoon, expressive characters, playful motion'
      }
      const stylePrompt = stylePrompts[document.querySelector('#style').value] || stylePrompts.cinematic
      const motion = document.querySelector('#motionPrompt').value.trim()
      const fullPrompt = (stylePrompt + '. ' + prompt + (motion ? '. Motion: ' + motion : '')).slice(0, 1800)
      const image = selectedImageData
        ? handle_file(await (await fetch(selectedImageData)).blob())
        : null
      const ratios = {
        '16:9': [1024, 576],
        '9:16': [576, 1024],
        '1:1': [896, 896]
      }
      const [width, height] = ratios[document.querySelector('#ratio').value] || ratios['16:9']
      const negativePrompt = 'Bright tones, overexposed, static, blurred details, subtitles, low quality, deformed faces or hands, watermark, text, signature'
      const durationSeconds = Number(document.querySelector('#duration').value) || 2
      const submission = client.submit('/generate_video', [
        image,
        fullPrompt,
        height,
        width,
        negativePrompt,
        durationSeconds,
        0,
        4,
        Math.floor(Math.random() * 2147483647),
        true
      ])
      let resultData = null
      for await (const event of submission) {
        if (event.type === 'status') {
          const stage = event.stage || event.status?.stage
          if (stage === 'error') throw new Error('SPACE_GENERATION_FAILED')
          if (stage === 'pending') {
            const queueText = event.position
              ? (lang === 'ar' ? 'طلبك في الانتظار، ترتيبه ' + event.position + '…' : 'Your request is queued at position ' + event.position + '…')
              : (lang === 'ar' ? 'بانتظار توفر مساحة التوليد…' : 'Waiting for the generation Space…')
            setProgress(queueText)
          } else if (stage === 'generating') {
            setProgress(lang === 'ar' ? 'يجري إنشاء الفيديو الآن؛ قد يستغرق ذلك بضع دقائق…' : 'The video is generating; this may take a few minutes…')
          }
        }
        if (event.type === 'data') resultData = event.data
      }

      const outputs = Array.isArray(resultData) ? resultData : resultData?.data
      const videoOutput = Array.isArray(outputs) ? outputs[0] : resultData?.video || resultData
      const videoUrl = getVideoFileUrl(videoOutput)
      if (!videoUrl) throw new Error('VIDEO_OUTPUT_MISSING')

      video.src = videoUrl
      videoLink.href = videoUrl
      videoPanel.hidden = false
      videoPanel.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setProgress(lang === 'ar' ? 'اكتمل الفيديو. يمكنك تشغيله أو فتحه للتنزيل.' : 'Your video is ready. Play it or open it to download.')
    } catch {
      setProgress(lang === 'ar'
        ? 'تعذّر إنشاء الفيديو. قد تكون المساحة مشغولة أو حصة اليوم انتهت؛ أعد ربط الحساب أو جرّب لاحقاً.'
        : 'Video generation failed. The Space may be busy or your daily quota may be used up. Reconnect your account or try again later.')
    } finally {
      button.disabled = false
      button.style.opacity = '1'
    }
  })
}
render()
