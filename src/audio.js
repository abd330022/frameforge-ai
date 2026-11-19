import { Client } from '@gradio/client'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

const VOICE_SPACE = 'k2-fsa/OmniVoice'
const VOICE_SPACE_URL = 'https://k2-fsa-omnivoice.hf.space'
const EFFECTS_SPACE = 'stabilityai/stable-audio-3'
const EFFECTS_SPACE_URL = 'https://stabilityai-stable-audio-3.hf.space'

function fileUrl(value, spaceUrl) {
  const candidate = value?.url || value?.path || value
  if (typeof candidate !== 'string' || !candidate) return null
  if (/^(https?:|blob:|data:)/i.test(candidate)) return candidate
  if (candidate.startsWith('/gradio_api/file=') || candidate.startsWith('/file=')) {
    return new URL(candidate, spaceUrl).toString()
  }
  return new URL('/gradio_api/file=' + encodeURIComponent(candidate), spaceUrl).toString()
}

async function submitSpace(space, endpoint, inputs, token, onProgress, label) {
  const client = await Client.connect(space, { token, events: ['data', 'status'] })
  const job = client.submit(endpoint, inputs)
  let output = null

  for await (const event of job) {
    if (event.type === 'status') {
      const stage = event.stage || event.status?.stage
      if (stage === 'error') throw new Error(label + '_FAILED')
      if (stage === 'pending') onProgress?.(label + '_WAITING')
      if (stage === 'generating') onProgress?.(label + '_GENERATING')
    }
    if (event.type === 'data') output = event.data
  }

  if (!output) throw new Error(label + '_NO_OUTPUT')
  return Array.isArray(output) ? output : (Array.isArray(output.data) ? output.data : output)
}

async function fetchAudioOutput(output, spaceUrl, name) {
  const candidate = output?.audio || output?.output || output
  const url = fileUrl(candidate, spaceUrl)
  if (!url) throw new Error('AUDIO_FILE_MISSING')
  const response = await fetch(url)
  if (!response.ok) throw new Error('AUDIO_DOWNLOAD_FAILED')
  const blob = await response.blob()
  if (!blob.size) throw new Error('AUDIO_FILE_EMPTY')
  return { name, blob, mimeType: blob.type || candidate?.mime_type || 'audio/wav', url }
}

export async function generateAudioTracks({
  token,
  prompt,
  dialogue,
  voiceProfile = {},
  language = 'ar',
  durationSeconds = 3,
  soundEffects = '',
  animalSounds = '',
  makeEffects = true,
  makeVoice = true,
  onProgress
}) {
  const tracks = []
  const errors = []
  const seconds = Math.max(3, Math.min(8, Number(durationSeconds) || 3))

  if (makeEffects) {
    try {
      const cues = [soundEffects, animalSounds].filter(Boolean).join(', ')
      const sceneDescription = [prompt, cues].filter(Boolean).join('. ')
      const effectsPrompt = ('Sound effects only. No music and no speech. Short cinematic scene ambience and audible actions: ' + sceneDescription).slice(0, 1200)
      onProgress?.('EFFECTS_CONNECTING')
      const outputs = await submitSpace(EFFECTS_SPACE, '/infer', [
        'small-sfx',
        effectsPrompt,
        seconds,
        8,
        1,
        'pingpong',
        0
      ], token, onProgress, 'EFFECTS')
      tracks.push(await fetchAudioOutput(outputs[0], EFFECTS_SPACE_URL, 'frameforge-sound-effects.wav'))
    } catch {
      errors.push('effects')
    }
  }

  if (makeVoice && dialogue?.trim()) {
    try {
      const gender = voiceProfile.gender || 'Auto'
      const age = voiceProfile.age || 'Auto'
      const pitch = voiceProfile.pitch || 'Auto'
      const style = voiceProfile.style || 'Auto'
      const accent = voiceProfile.english_accent || 'Auto'
      const dialect = voiceProfile.chinese_dialect || 'Auto'
      const voiceLanguage = 'Auto'
      onProgress?.('VOICE_CONNECTING')
      const outputs = await submitSpace(VOICE_SPACE, '/_design_fn', [
        dialogue.trim().slice(0, 600),
        voiceLanguage,
        24,
        2,
        true,
        1,
        null,
        true,
        true,
        gender,
        age,
        pitch,
        style,
        accent,
        dialect
      ], token, onProgress, 'VOICE')
      tracks.push(await fetchAudioOutput(outputs[0], VOICE_SPACE_URL, 'frameforge-character-voice.wav'))
    } catch {
      errors.push('voice')
    }
  }

  if (!tracks.length) throw new Error(errors.includes('voice') ? 'VOICE_GENERATION_FAILED' : 'AUDIO_GENERATION_FAILED')
  return { tracks, errors }
}

let ffmpeg
let ffmpegReady

async function getFFmpeg() {
  if (ffmpeg) return ffmpeg
  if (!ffmpegReady) {
    ffmpegReady = (async () => {
      const instance = new FFmpeg()
      const coreBase = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm'
      await instance.load({
        coreURL: await toBlobURL(coreBase + '/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL(coreBase + '/ffmpeg-core.wasm', 'application/wasm')
      })
      ffmpeg = instance
      return instance
    })().catch(error => {
      ffmpegReady = null
      throw error
    })
  }
  return ffmpegReady
}

export async function muxAudioIntoVideo(videoUrl, tracks, durationSeconds) {
  if (!tracks?.length) throw new Error('NO_AUDIO_TRACKS')
  const videoResponse = await fetch(videoUrl)
  if (!videoResponse.ok) throw new Error('VIDEO_DOWNLOAD_FAILED')
  const videoBlob = await videoResponse.blob()
  const engine = await getFFmpeg()
  const videoBytes = new Uint8Array(await videoBlob.arrayBuffer())
  const seconds = String(Math.max(3, Math.min(8, Number(durationSeconds) || 3)))
  const videoName = 'frameforge-input-video.mp4'
  await engine.writeFile(videoName, videoBytes)

  for (let index = 0; index < tracks.length; index += 1) {
    const bytes = new Uint8Array(await tracks[index].blob.arrayBuffer())
    await engine.writeFile('frameforge-audio-' + index + '.wav', bytes)
  }

  const filters = tracks.map((track, index) => {
    const volume = track.name.includes('voice') ? '1' : '0.7'
    return '[' + (index + 1) + ':a]volume=' + volume + '[a' + index + ']'
  })
  const mixInputs = tracks.map((track, index) => '[a' + index + ']').join('')
  filters.push(mixInputs + 'amix=inputs=' + tracks.length + ':duration=longest:normalize=0:dropout_transition=0[aout]')
  const filterGraph = filters.join(';')
  const audioInputs = tracks.flatMap((track, index) => ['-i', 'frameforge-audio-' + index + '.wav'])
  const mixCode = await engine.exec([
    '-i', videoName,
    ...audioInputs,
    '-filter_complex', filterGraph,
    '-map', '[aout]',
    '-t', seconds,
    '-c:a', 'pcm_s16le',
    'frameforge-audio-mix.wav'
  ])
  if (mixCode !== 0) throw new Error('AUDIO_MIX_FAILED')

  const videoArgs = [
    '-i', videoName,
    ...audioInputs,
    '-filter_complex', filterGraph,
    '-map', '0:v:0',
    '-map', '[aout]',
    '-t', seconds,
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart'
  ]
  let videoCode = await engine.exec([...videoArgs, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '25', 'frameforge-output.mp4'])
  if (videoCode !== 0) {
    try { await engine.deleteFile('frameforge-output.mp4') } catch {}
    videoCode = await engine.exec([...videoArgs, '-c:v', 'copy', 'frameforge-output.mp4'])
  }
  if (videoCode !== 0) throw new Error('VIDEO_MUX_FAILED')

  const videoOutput = await engine.readFile('frameforge-output.mp4')
  const mixOutput = await engine.readFile('frameforge-audio-mix.wav')
  const result = {
    videoBlob: new Blob([videoOutput], { type: 'video/mp4' }),
    audioBlob: new Blob([mixOutput], { type: 'audio/wav' })
  }
  for (const name of [videoName, 'frameforge-output.mp4', 'frameforge-audio-mix.wav', ...tracks.map((track, index) => 'frameforge-audio-' + index + '.wav')]) {
    try { await engine.deleteFile(name) } catch {}
  }
  return result
}
