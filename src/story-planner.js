export function mountStoryPlanner() {
  const prompt = document.querySelector('#prompt');
  const card = document.querySelector('.creator-card');
  if (!prompt || !card || document.querySelector('#storyPlanner')) return;

  const panel = document.createElement('section');
  panel.id = 'storyPlanner';
  panel.className = 'story-planner';
  panel.innerHTML = `
    <div class="story-planner-heading">
      <div><span class="section-kicker">STORY / 01</span><h3>حوّل قصتك إلى مشاهد</h3></div>
      <span class="story-planner-tag">مخطط القصة</span>
    </div>
    <p>اكتب قصتك في المربع أعلاه، ثم دع الذكاء الاصطناعي يقسمها إلى مشاهد وشخصيات وحوارات وحركة كاميرا.</p>
    <button type="button" id="planStoryBtn" class="generate-btn">✦ تحليل القصة وإنشاء المشاهد</button>
    <div id="storyPlannerStatus" class="notice" role="status"></div>
    <div id="storyboardResult" class="storyboard-result" hidden></div>
  `;
  const promptLabel = prompt.closest('label');
  const textarea = prompt;
  textarea.insertAdjacentElement('afterend', panel);

  const button = panel.querySelector('#planStoryBtn');
  const status = panel.querySelector('#storyPlannerStatus');
  const result = panel.querySelector('#storyboardResult');

  button.addEventListener('click', async () => {
    const story = textarea.value.trim();
    if (story.length < 10) {
      status.textContent = 'اكتب قصتك أولاً (10 أحرف على الأقل).';
      return;
    }
    button.disabled = true;
    status.textContent = 'يجري تحليل القصة وبناء المشاهد...';
    result.hidden = true;
    try {
      const response = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          language: document.documentElement.lang === 'en' ? 'en' : 'ar',
          style: document.querySelector('#style')?.value || 'Cartoon',
          duration: document.querySelector('#duration')?.value || '30 seconds'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذّر تحليل القصة.');
      const board = data.storyboard;
      window.dispatchEvent(new CustomEvent('frameforge:storyboard-ready', { detail: { story, storyboard: board } }));
      const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      result.innerHTML = `
        <div class="storyboard-summary"><h3>${escapeHtml(board.title)}</h3><p>${escapeHtml(board.logline)}</p></div>
        <h4>الشخصيات</h4>
        <div class="storyboard-characters">${(board.characters || []).map(character => `
          <article class="storyboard-character"><strong>${escapeHtml(character.name)}</strong><p>${escapeHtml(character.description)}</p><small>الهوية البصرية: ${escapeHtml(character.visual_identity)}</small></article>
        `).join('')}</div>
        <h4>مشاهد القصة (${board.scenes.length})</h4>
        <div class="storyboard-scenes">${board.scenes.map(scene => `
          <article class="storyboard-scene">
            <div class="storyboard-scene-top"><strong>المشهد ${scene.number}: ${escapeHtml(scene.title)}</strong><span>${scene.duration_seconds} ثانية</span></div>
            <p><b>المكان:</b> ${escapeHtml(scene.location)}</p>
            <p><b>الصورة:</b> ${escapeHtml(scene.visual_description)}</p>
            <p><b>الحركة:</b> ${escapeHtml(scene.action)}</p>
            <p><b>الكاميرا:</b> ${escapeHtml(scene.camera)}</p>
            ${(scene.dialogue || []).map(line => `<p><b>${escapeHtml(line.character)}:</b> ${escapeHtml(line.line)}</p>`).join('')}
            <small>المؤثرات: ${escapeHtml((scene.sound_effects || []).join('، '))}</small>
          </article>
        `).join('')}</div>
        <p class="notice">هذا مخطط للمشاهد فقط. لم يتم إنشاء صور أو فيديو بعد.</p>
      `;
      result.hidden = false;
      status.textContent = 'تم إعداد مخطط القصة بنجاح.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}
