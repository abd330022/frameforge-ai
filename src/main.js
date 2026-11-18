import './style.css'
import { mountCharacterLibrary } from './character-library.js'

const copy = {
  ar: {
    navCreate: 'إنشاء فيديو', navExplore: 'استكشف', signIn: 'تسجيل الدخول',
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
    generate: 'إنشاء الفيديو', free: 'تجربة الواجهة — بدون تكلفة',
    ideas: 'أفكار تلهمك', idea1: 'مدينة مستقبلية تحت المطر', idea2: 'مغامرة كرتونية في الغابة', idea3: 'إعلان سينمائي لمنتجك',
    how: 'من الفكرة إلى الفيديو بثلاث خطوات', step1: 'اكتب فكرتك', step1d: 'صف المشهد الذي تريد رؤيته ببساطة.', step2: 'اختر أسلوبك', step2d: 'حدد النمط والمدة والأبعاد المناسبة.', step3: 'أنشئ وشارك', step3d: 'راجع النتيجة وجهّزها للمشاركة.',
    footer: 'مساحة إبداعك تبدأ من هنا.', demoTitle: 'واجهة تجريبية', demoText: 'تم تجهيز واجهة FrameForge AI. ربط محرك توليد الفيديو الحقيقي سيكون الخطوة التالية، وقد يتطلب مفتاح API من مزوّد خارجي.',
    alertPrompt: 'اكتب وصفاً للفيديو أولاً.', alertDemo: 'هذه نسخة تجريبية للواجهة فقط. لم يتم إنشاء فيديو فعلي بعد؛ نحتاج إلى ربط خدمة توليد فيديو.',
    language: 'English'
  },
  en: {
    navCreate: 'Create video', navExplore: 'Explore', signIn: 'Sign in',
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
    generate: 'Create video', free: 'Interface preview — no cost',
    ideas: 'Ideas to inspire you', idea1: 'A futuristic city in the rain', idea2: 'A cartoon adventure in the forest', idea3: 'A cinematic product commercial',
    how: 'From idea to video in three steps', step1: 'Write your idea', step1d: 'Describe the scene you want to see.', step2: 'Choose your style', step2d: 'Set the visual style, duration and ratio.', step3: 'Create and share', step3d: 'Review your result and get it ready to share.',
    footer: 'Your creative space starts here.', demoTitle: 'Prototype interface', demoText: 'The FrameForge AI interface is ready. Connecting a real video-generation engine is the next step and may require an API key from an external provider.',
    alertPrompt: 'Please describe your video first.', alertDemo: 'This is currently an interface prototype. No video has been generated yet; a video-generation service still needs to be connected.',
    language: 'العربية'
  }
}

let lang = 'ar'
let mode = 'text'
let selectedImage = null
let selectedImageData = null
const t = key => copy[lang][key]
const app = document.querySelector('#app')

function render() {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  app.innerHTML = `
    <aside class="side-nav"><a class="brand side-brand" href="#home"><span class="brand-mark">F</span><span>FrameForge <i>AI</i></span></a><div class="side-caption">مساحة العمل</div><nav class="side-links"><a href="#home">⌂　الرئيسية</a><a class="side-active" href="#create">✦　إنشاء الفيديو</a><a href="#ideas">◈　استكشاف</a><a href="#create">▤　مشاريعي</a><a href="#characterLibrary">♙　مكتبة الشخصيات</a></nav><div class="side-bottom"><a href="#create">⚙　الإعدادات</a><a href="#how">؟　المساعدة</a></div></aside>
    <header class="topbar">
      <a class="brand" href="#" aria-label="FrameForge AI home"><span class="brand-mark">F</span><span>FrameForge <i>AI</i></span></a>
      <nav><a href="#create">${t('navCreate')}</a><a href="#how">${t('navExplore')}</a></nav>
      <div class="top-actions"><button class="lang-btn" id="langBtn">${t('language')}</button><a class="signin" href="#create">${t('signIn')}</a></div>
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
            <div class="setting"><label for="duration">${t('duration')}</label><select id="duration"><option>5 ${t('seconds')}</option><option>10 ${t('seconds')}</option><option>15 ${t('seconds')}</option></select></div>
            <div class="setting"><label for="style">${t('style')}</label><select id="style"><option>${t('cinematic')}</option><option>${t('realistic')}</option><option>${t('anime')}</option><option>${t('cartoon')}</option></select></div>
            <div class="setting"><label for="ratio">${t('ratio')}</label><select id="ratio"><option>16:9</option><option>9:16</option><option>1:1</option></select></div>
          </div>
          <button class="generate-btn" id="generateBtn"><span>✦</span>${t('generate')} <b>↗</b></button>
          <p class="notice" id="notice">✧ ${t('demoText')}</p>
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
  document.querySelector('#generateBtn').addEventListener('click', async () => {
    const prompt = document.querySelector('#prompt').value.trim()
    const toast = document.querySelector('#toast')
    const button = document.querySelector('#generateBtn')
    const showToast = message => {
      toast.textContent = message
      toast.classList.add('show')
    }
    if (!prompt) {
      showToast(t('alertPrompt'))
      return
    }
    button.disabled = true
    button.style.opacity = '.65'
    showToast(lang === 'ar' ? 'جارٍ إرسال طلبك إلى محرك الفيديو...' : 'Sending your request to the video engine...')
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          motion: document.querySelector('#motionPrompt').value.trim(),
          mode,
          imageData: selectedImageData,
          duration: document.querySelector('#duration').value,
          aspectRatio: document.querySelector('#ratio').value,
          style: document.querySelector('#style').value
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation request failed.')
      showToast(lang === 'ar' ? 'تم إرسال الطلب إلى محرك الفيديو بنجاح.' : 'Your request was accepted by the video engine.')
    } catch (error) {
      showToast(lang === 'ar'
        ? (error.message.includes('not connected') || error.message.includes('not configured')
            ? 'واجهة الموقع أصبحت جاهزة للاتصال، لكن مزوّد توليد الفيديو لم يُربط بعد. لم يتم إنشاء فيديو ولم تُخصم أي أموال.'
            : 'تعذّر إرسال الطلب: ' + error.message)
        : error.message)
    } finally {
      button.disabled = false
      button.style.opacity = '1'
    }
  })
}
render()
