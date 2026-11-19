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

import { mountStoryPlanner } from './story-planner.js'
import { generateAudioTracks, muxAudioIntoVideo } from './audio.js'
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
    autoCharacterVoice: 'توليد صوت الشخصية تلقائياً', autoCharacterVoiceHint: 'سيكتب الذكاء الاصطناعي حواراً قصيراً عند الحاجة، ويختار نبرة مناسبة لوصف الشخصية. حركة الشفاه لا تتزامن مع الكلام حالياً.',
    characterDialogue: 'حوار الشخصية (اختياري)', characterDialogueHint: 'اكتب جملة للشخصية، أو اتركه فارغاً ليكتب الذكاء الاصطناعي حواراً مناسباً للقصة.',
    soundTitle: 'الصوت والحوار والمؤثرات', autoSounds: 'توليد المؤثرات الصوتية تلقائياً', autoSoundsHint: 'ينشئ الذكاء الاصطناعي أصواتاً مناسبة للمشهد والحيوانات المذكورة.',
    soundEffects: 'مؤثرات إضافية', soundEffectsHint: 'مثل خطوات، مطر ورعد، اصطدام أو تحطم زجاج', animalSounds: 'أصوات حيوانات إضافية', animalSoundsHint: 'مثل كلب، قطة، حصان أو طيور',
    duration: 'المدة', style: 'النمط البصري', ratio: 'الأبعاد',
    seconds: 'ثوانٍ', cinematic: 'سينمائي', anime: 'أنمي', realistic: 'واقعي', cartoon: 'كرتوني',
    generate: 'إنشاء الفيديو', free: 'تجربة مجانية — تستخدم حصة Hugging Face',
    ideas: 'أفكار تلهمك', idea1: 'مدينة مستقبلية تحت المطر', idea2: 'مغامرة كرتونية في الغابة', idea3: 'إعلان سينمائي لمنتجك',
    how: 'من الفكرة إلى الفيديو بثلاث خطوات', step1: 'اكتب فكرتك', step1d: 'صف المشهد الذي تريد رؤيته ببساطة.', step2: 'اختر أسلوبك', step2d: 'حدد النمط والمدة والأبعاد المناسبة.', step3: 'أنشئ وشارك', step3d: 'راجع النتيجة وجهّزها للمشاركة.',
    footer: 'مساحة إبداعك تبدأ من هنا.', demoTitle: 'معلومة عن التوليد', demoText: 'تتوفر مدد 3 أو 5 أو 8 ثوانٍ؛ المدة الأطول تستهلك حصة ZeroGPU أكثر. سيرسل الموقع وصفك والصورة التي تختارها ورمز وصول Hugging Face إلى مساحة عامة يديرها Upsampler.',
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
    autoCharacterVoice: 'Generate character voice automatically', autoCharacterVoiceHint: 'AI can write a short line when needed and select a voice style from the character description. Lip movement is not synchronized yet.',
    characterDialogue: 'Character dialogue (optional)', characterDialogueHint: 'Write a line for the character, or leave this blank and AI will create dialogue that fits the story.',
    soundTitle: 'Voice, dialogue and sound effects', autoSounds: 'Generate sound effects automatically', autoSoundsHint: 'AI creates effects that fit the scene and any animals mentioned.',
    soundEffects: 'Extra sound effects', soundEffectsHint: 'For example: footsteps, rain and thunder, collision, or breaking glass', animalSounds: 'Extra animal sounds', animalSoundsHint: 'For example: dog, cat, horse, or birds',
    duration: 'Duration', style: 'Visual style', ratio: 'Aspect ratio',
    seconds: 'seconds', cinematic: 'Cinematic', anime: 'Anime', realistic: 'Realistic', cartoon: 'Cartoon',
    generate: 'Create video', free: 'Free trial — uses Hugging Face quota',
    ideas: 'Ideas to inspire you', idea1: 'A futuristic city in the rain', idea2: 'A cartoon adventure in the forest', idea3: 'A cinematic product commercial',
    how: 'From idea to video in three steps', step1: 'Write your idea', step1d: 'Describe the scene you want to see.', step2: 'Choose your style', step2d: 'Set the visual style, duration and ratio.', step3: 'Create and share', step3d: 'Review your result and get it ready to share.',
    footer: 'Your creative space starts here.', demoTitle: 'About generation', demoText: 'Choose 3, 5, or 8 seconds. Longer clips use more ZeroGPU quota. The site sends your prompt, selected image, and Hugging Face access token to Upsampler’s public Hugging Face Space.',
    alertPrompt: 'Please describe your video first.', alertDemo: 'Video generation failed. The shared Space may be busy or your daily ZeroGPU quota may be used up. Please try again later.',
    language: 'العربية'
  }
}

let lang = 'ar'
let mode = 'text'
let selectedImage = null
let selectedImageData = null
let latestStoryboard = null
let generatedVideoObjectUrl = null
let generatedMixObjectUrl = null
let generatedTrackObjectUrls = []
window.addEventListener('frameforge:storyboard-ready', event => { latestStoryboard = event.detail })
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
    <aside class="side-nav"><a class="brand side-brand" href="#home"><span class="brand-mark">F</span><span>FrameForge <i>AI</i></span></a><div class="side-caption">مساحة العمل</div><nav class="side-links"><a href="#home">⌂　الرئيسية</a><a class="side-active" href="#create">✦　إنشاء الفيديو</a><a href="#ideas">◈　استكشاف</a><a href="#create">▤　مشاريعي</a></nav><div class="side-bottom"><a href="#create">⚙　الإعدادات</a><a href="#how">؟　المساعدة</a></div></aside>
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
            <section class="sound-panel">
              <h3>${t('soundTitle')}</h3>
              <label class="save-character"><input type="checkbox" id="characterAudioMode" checked /> ${t('autoCharacterVoice')}</label>
              <p class="notice">${t('autoCharacterVoiceHint')}</p>
              <div class="setting"><label for="characterDialogue">${t('characterDialogue')}</label><textarea id="characterDialogue" rows="2" placeholder="${t('characterDialogueHint')}"></textarea></div>
              <label class="save-character"><input type="checkbox" id="autoSounds" checked /> ${t('autoSounds')}</label>
              <p class="notice">${t('autoSoundsHint')}</p>
              <div class="settings-grid">
                <div class="setting"><label for="animalSounds">${t('animalSounds')}</label><input id="animalSounds" type="text" placeholder="${t('animalSoundsHint')}" /></div>
                <div class="setting"><label for="soundEffects">${t('soundEffects')}</label><input id="soundEffects" type="text" placeholder="${t('soundEffectsHint')}" /></div>
              </div>
            </section>
          </div>
          <div class="settings-grid">
            <div class="setting"><label for="duration">${t('duration')}</label><select id="duration"><option value="3">3 ${t('seconds')}</option><option value="5">5 ${t('seconds')}</option><option value="8">8 ${t('seconds')}</option></select></div>
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
            <input id="aiVoiceConsent" type="checkbox" />
            <span>${lang === 'ar' ? 'أوافق على تحليل وصفي عبر Gemini داخل FrameForge لكتابة حوار قصير واختيار ملف صوت للشخصية. قد يستهلك ذلك حصة Gemini الخاصة بالموقع.' : 'I agree to have FrameForge analyze my description with Gemini to write a short line and select a character voice profile. This may use the site’s Gemini API quota.'}</span>
          </label>
          <label class="hf-video-consent">
            <input id="hfAudioConsent" type="checkbox" />
            <span>${lang === 'ar' ? 'أوافق على إرسال وصف المشهد إلى Stable Audio لإنشاء المؤثرات، والحوار وملف الصوت الذي اختاره Gemini إلى OmniVoice، ورمز Hugging Face إلى المساحتين العامتين لتوليد الصوت. قد تُستخدم حصة ZeroGPU أو أرصدة مدفوعة.' : 'I agree to send the scene description to Stable Audio for effects, the dialogue and Gemini-selected voice profile to OmniVoice for speech, and my Hugging Face access token to both public Spaces. This may use ZeroGPU quota or paid credits.'}</span>
          </label>
          <label class="hf-video-consent">
            <input id="hfVideoConsent" type="checkbox" />
            <span>${lang === 'ar' ? 'أوافق على إرسال وصفي والصورة (إن وُجدت) ورمز وصول Hugging Face إلى مساحة عامة يديرها Upsampler لإنشاء الفيديو وربط الاستخدام بحصة حسابي. قد تُستخدم أرصدة مدفوعة بعد انتهاء الحصة المجانية.' : 'I agree to send my prompt, image (if any), and Hugging Face access token to Upsampler’s public Hugging Face Space to create the video and associate usage with my account quota. Paid credits may be used after the free quota is exhausted.'}</span>
          </label>
          <p class="hf-video-disclosure">${lang === 'ar' ? 'اختر مدة 3 أو 5 أو 8 ثوانٍ. المدة الأطول تستهلك حصة أكبر، وقد يستغرق الانتظار والتوليد عدة دقائق.' : 'Choose 3, 5, or 8 seconds. Longer clips use more of your quota, and queueing and generation may take several minutes.'}</p>
          <button class="generate-btn" id="generateBtn"><span>✦</span>${t('generate')} <b>↗</b></button>
          <p class="notice" id="notice">✧ ${t('demoText')}</p>
          <div class="generated-video-panel" id="generatedVideoPanel" hidden>
            <h3>${lang === 'ar' ? 'الفيديو الذي أنشأته' : 'Your generated video'}</h3>
            <video id="generatedVideo" controls playsinline></video>
            <a class="generated-video-link" id="generatedVideoLink" target="_blank" rel="noopener noreferrer">${lang === 'ar' ? 'فتح الفيديو أو تنزيله' : 'Open or download video'}</a>
            <div class="generated-audio-panel" id="generatedAudioPanel" hidden>
              <h3>${lang === 'ar' ? 'الصوت الذي أنشأته' : 'Generated audio'}</h3>
              <audio id="generatedAudio" controls hidden></audio>
              <a class="generated-video-link" id="generatedAudioLink" hidden>${lang === 'ar' ? 'تنزيل الصوت' : 'Download audio'}</a>
              <div id="generatedAudioTracks"></div>
              <p class="notice" id="generatedAudioStatus"></p>
            </div>
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
  mountStoryPlanner()
  mountHuggingFaceConnect(lang)
  document.querySelector('#langBtn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; render() })
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
    const videoConsent = document.querySelector('#hfVideoConsent')
    const audioConsent = document.querySelector('#hfAudioConsent')
    const aiVoiceConsent = document.querySelector('#aiVoiceConsent')
    const videoPanel = document.querySelector('#generatedVideoPanel')
    const audioPanel = document.querySelector('#generatedAudioPanel')
    const video = document.querySelector('#generatedVideo')
    const videoLink = document.querySelector('#generatedVideoLink')
    const audio = document.querySelector('#generatedAudio')
    const audioLink = document.querySelector('#generatedAudioLink')
    const audioTracksPanel = document.querySelector('#generatedAudioTracks')
    const audioStatus = document.querySelector('#generatedAudioStatus')
    const showToast = message => {
      toast.textContent = message
      toast.classList.add('show')
    }
    const setProgress = message => {
      document.querySelector('#notice').textContent = '✧ ' + message
      showToast(message)
    }
    const voiceEnabled = document.querySelector('#characterAudioMode').checked
    const soundEffectsInput = document.querySelector('#soundEffects').value.trim()
    const animalSoundsInput = document.querySelector('#animalSounds').value.trim()
    const makeEffects = document.querySelector('#autoSounds').checked || Boolean(soundEffectsInput || animalSoundsInput)
    const manualDialogue = document.querySelector('#characterDialogue').value.trim()

    if (!prompt) {
      showToast(t('alertPrompt'))
      return
    }
    if (!getHuggingFaceAccessToken()) {
      showToast(lang === 'ar' ? 'اربط حساب Hugging Face أولاً.' : 'Connect your Hugging Face account first.')
      document.querySelector('#huggingFaceConnect').scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!videoConsent.checked) {
      showToast(lang === 'ar' ? 'وافق على إرسال الوصف والصورة إلى Upsampler قبل إنشاء الفيديو.' : 'Please consent to sending the prompt and image to Upsampler before generating.')
      videoConsent.focus()
      return
    }
    if ((makeEffects || voiceEnabled) && !audioConsent.checked) {
      showToast(lang === 'ar' ? 'وافق على إرسال بيانات الصوت إلى خدمات الصوت أولاً.' : 'Please consent to sending audio data to the audio services first.')
      audioConsent.focus()
      return
    }
    if (mode === 'image' && !selectedImageData) {
      showToast(lang === 'ar' ? 'أضف صورة مرجعية أولاً.' : 'Add a reference image first.')
      return
    }

    let storyBoard = latestStoryboard?.story === prompt ? latestStoryboard.storyboard : null
    let hasVoiceProfile = Boolean(storyBoard?.characters?.some(character => character.voice_profile))
    const needsVoiceAnalysis = voiceEnabled && !hasVoiceProfile
    if (needsVoiceAnalysis && !aiVoiceConsent.checked) {
      showToast(lang === 'ar' ? 'وافق على استخدام Gemini لاختيار الحوار وملف صوت الشخصية.' : 'Please consent to Gemini creating dialogue and selecting a character voice profile.')
      aiVoiceConsent.focus()
      return
    }

    button.disabled = true
    button.style.opacity = '.65'
    videoPanel.hidden = true
    audioPanel.hidden = true
    video.pause()
    video.removeAttribute('src')
    video.load()
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    if (generatedVideoObjectUrl) URL.revokeObjectURL(generatedVideoObjectUrl)
    if (generatedMixObjectUrl) URL.revokeObjectURL(generatedMixObjectUrl)
    generatedTrackObjectUrls.forEach(url => URL.revokeObjectURL(url))
    generatedVideoObjectUrl = null
    generatedMixObjectUrl = null
    generatedTrackObjectUrls = []
    videoLink.removeAttribute('download')
    videoLink.setAttribute('target', '_blank')
    videoLink.textContent = lang === 'ar' ? 'فتح الفيديو أو تنزيله' : 'Open or download video'
    audioTracksPanel.replaceChildren()
    audioStatus.textContent = ''

    try {
      const token = getHuggingFaceAccessToken()
      const durationSeconds = Number(document.querySelector('#duration').value) || 3
      const style = document.querySelector('#style').value
      const language = lang === 'en' ? 'en' : 'ar'

      if (needsVoiceAnalysis) {
        setProgress(lang === 'ar' ? 'يكتب Gemini حواراً قصيراً ويختار ملف صوت الشخصية…' : 'Gemini is writing a short line and selecting the character voice…')
        try {
          const response = await fetch('/api/storyboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              story: prompt,
              language,
              style,
              duration: durationSeconds + ' seconds'
            })
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error || 'STORYBOARD_FAILED')
          storyBoard = data.storyboard
          latestStoryboard = { story: prompt, storyboard: storyBoard }
          window.dispatchEvent(new CustomEvent('frameforge:storyboard-ready', { detail: latestStoryboard }))
        } catch {
          storyBoard = null
        }
      }

      const storyDialogue = (storyBoard?.scenes || [])
        .flatMap(scene => scene.dialogue || [])
        .find(line => line && typeof line.line === 'string' && line.line.trim())
      const dialogue = manualDialogue || storyDialogue?.line || ''
      const speakerName = storyDialogue?.character || ''
      const character = (storyBoard?.characters || []).find(item => item.name === speakerName) || storyBoard?.characters?.[0] || null
      const voiceProfile = character?.voice_profile || {}

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
      const stylePrompt = stylePrompts[style] || stylePrompts.cinematic
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

      if (makeEffects || (voiceEnabled && dialogue)) {
        audioPanel.hidden = false
        const progressMessages = {
          EFFECTS_CONNECTING: lang === 'ar' ? 'يجري تجهيز المؤثرات الصوتية…' : 'Preparing sound effects…',
          EFFECTS_WAITING: lang === 'ar' ? 'المؤثرات الصوتية في الانتظار…' : 'Sound effects are queued…',
          EFFECTS_GENERATING: lang === 'ar' ? 'يجري إنشاء المؤثرات الصوتية…' : 'Generating sound effects…',
          VOICE_CONNECTING: lang === 'ar' ? 'يجري تجهيز صوت الشخصية…' : 'Preparing the character voice…',
          VOICE_WAITING: lang === 'ar' ? 'صوت الشخصية في الانتظار…' : 'Character voice is queued…',
          VOICE_GENERATING: lang === 'ar' ? 'يجري إنشاء صوت الشخصية…' : 'Generating the character voice…'
        }
        try {
          const audioResult = await generateAudioTracks({
            token,
            prompt,
            dialogue,
            voiceProfile,
            language,
            durationSeconds,
            soundEffects: soundEffectsInput,
            animalSounds: animalSoundsInput,
            makeEffects,
            makeVoice: voiceEnabled && Boolean(dialogue),
            onProgress: stage => { if (progressMessages[stage]) setProgress(progressMessages[stage]) }
          })

          for (const track of audioResult.tracks) {
            const row = document.createElement('div')
            row.className = 'generated-audio-track'
            const title = document.createElement('strong')
            title.textContent = track.name.includes('voice')
              ? (lang === 'ar' ? 'صوت الشخصية' : 'Character voice')
              : (lang === 'ar' ? 'المؤثرات الصوتية' : 'Sound effects')
            const player = document.createElement('audio')
            player.controls = true
            const trackUrl = URL.createObjectURL(track.blob)
            generatedTrackObjectUrls.push(trackUrl)
            player.src = trackUrl
            const link = document.createElement('a')
            link.href = trackUrl
            link.download = track.name
            link.textContent = lang === 'ar' ? 'تنزيل هذا المسار الصوتي' : 'Download this audio track'
            row.append(title, player, link)
            audioTracksPanel.append(row)
          }

          if (audioResult.errors.length) {
            audioStatus.textContent = lang === 'ar'
              ? 'اكتمل جزء من الصوت فقط؛ إحدى خدمات الصوت لم تُكمل طلبها.'
              : 'Only part of the audio was generated; one audio service did not finish.'
          }

          try {
            setProgress(lang === 'ar' ? 'يجري دمج الصوت مع الفيديو…' : 'Mixing the sound into the video…')
            const muxed = await muxAudioIntoVideo(videoUrl, audioResult.tracks, durationSeconds)
            generatedVideoObjectUrl = URL.createObjectURL(muxed.videoBlob)
            generatedMixObjectUrl = URL.createObjectURL(muxed.audioBlob)
            video.src = generatedVideoObjectUrl
            videoLink.href = generatedVideoObjectUrl
            videoLink.removeAttribute('target')
            videoLink.removeAttribute('rel')
            videoLink.download = 'frameforge-ai-with-sound.mp4'
            videoLink.textContent = lang === 'ar' ? 'تنزيل الفيديو مع الصوت' : 'Download video with sound'
            audio.src = generatedMixObjectUrl
            audio.hidden = false
            audioLink.href = generatedMixObjectUrl
            audioLink.download = 'frameforge-ai-audio-mix.wav'
            audioLink.textContent = lang === 'ar' ? 'تنزيل الصوت' : 'Download audio'
            audioLink.hidden = false
            audioTracksPanel.hidden = true
            const hasVoiceTrack = audioResult.tracks.some(track => track.name.includes('voice'))
            const hasEffectsTrack = audioResult.tracks.some(track => track.name.includes('effects'))
            if (audioResult.errors.length) {
              audioStatus.textContent = lang === 'ar'
                ? 'تم دمج الصوت الذي أُنشئ، لكن إحدى خدمات الصوت لم تُكمل طلبها.'
                : 'Generated audio was mixed into the video, but one audio service did not finish.'
            } else if (hasVoiceTrack && hasEffectsTrack) {
              audioStatus.textContent = lang === 'ar'
                ? 'تم دمج صوت الشخصية والمؤثرات الصوتية داخل الفيديو.'
                : 'The character voice and sound effects are mixed into the video.'
            } else if (hasVoiceTrack) {
              audioStatus.textContent = lang === 'ar'
                ? 'تم دمج صوت الشخصية داخل الفيديو.'
                : 'The character voice is mixed into the video.'
            } else {
              audioStatus.textContent = lang === 'ar'
                ? 'تم دمج المؤثرات الصوتية داخل الفيديو.' + (voiceEnabled && !dialogue ? ' لم ينتج الذكاء الاصطناعي حواراً؛ أضف جملة لإنشاء صوت الشخصية.' : '')
                : 'Sound effects are mixed into the video.' + (voiceEnabled && !dialogue ? ' AI did not create dialogue; add a line to generate the character voice.' : '')
            }
          } catch {
            audio.hidden = true
            audioLink.hidden = true
            audioTracksPanel.hidden = false
            audioStatus.textContent = lang === 'ar'
              ? 'تم إنشاء الصوت، لكن تعذّر دمجه داخل الفيديو على هذا الجهاز. يمكنك تشغيل المسارات وتنزيلها منفصلة.'
              : 'Audio was generated but could not be mixed into the video on this device. You can play and download the separate tracks.'
          }
        } catch {
          audioStatus.textContent = lang === 'ar'
            ? (voiceEnabled && dialogue ? 'تعذّر إنشاء الصوت. قد تكون حصة Hugging Face اليومية انتهت أو الخدمة مشغولة.' : 'تعذّر إنشاء المؤثرات الصوتية. جرّب لاحقاً.')
            : 'Audio generation failed. The daily Hugging Face quota may be used up, or the service may be busy.'
        }
      } else if (voiceEnabled) {
        audioPanel.hidden = false
        audioStatus.textContent = lang === 'ar'
          ? 'أُنشئ الفيديو. لم ينتج الذكاء الاصطناعي حواراً لهذه الشخصية؛ أضف جملة في خانة الحوار لإنشاء صوتها.'
          : 'Video created. AI did not produce a dialogue line for this character; add a line to generate its voice.'
      }

      videoPanel.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setProgress(lang === 'ar' ? 'اكتمل الفيديو. يمكنك تشغيله أو تنزيله مع الصوت.' : 'Your video is ready. Play it or download it with sound.')
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
