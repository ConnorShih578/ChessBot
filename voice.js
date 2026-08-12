// Voice Commentary (Text-to-Speech) System for TimChess

const VOICE_PROFILES = {
    fwog: { pitch: 1.6, rate: 1.15, genderPref: 'female' },
    turtle: { pitch: 0.6, rate: 0.75, genderPref: 'male' },
    cooper: { pitch: 0.7, rate: 0.9, genderPref: 'male' },
    martina: { pitch: 1.0, rate: 1.0, genderPref: 'female' },
    timmy: { pitch: 1.1, rate: 1.0, genderPref: 'male' },
    antigravity: { pitch: 1.0, rate: 1.15, genderPref: 'male' },
    chicken: { pitch: 1.8, rate: 1.3, genderPref: 'female' },
    default: { pitch: 0.9, rate: 1.0, genderPref: 'male' }
};

let voiceMuted = localStorage.getItem('timchess_voice_muted') === 'true';

function isVoiceMuted() {
    return voiceMuted;
}

function toggleVoiceMute() {
    voiceMuted = !voiceMuted;
    localStorage.setItem('timchess_voice_muted', voiceMuted);
    if (voiceMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    return voiceMuted;
}

function cleanRolePrefixes(text) {
    return text.replace(/^(HUMAN|BOT|STOCKFISH|FWOG|KOOPA|TURTLE|MARTINA|TIMMY|ANTIGRAVITY|CHICKEN):\s*/gi, '').trim();
}

function speakVoice(text, botKey = 'default') {
    if (voiceMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    let cleanText = cleanRolePrefixes(text)
        .replace(/[*_#>~`]/g, '')
        .replace(/\(thinking\.\.\.\)/gi, '')
        .replace(/\(analysing\.\.\.\)/gi, '')
        .replace(/\(pecking\.\.\.\)/gi, '')
        .trim();

    if (!cleanText) return;

    const profile = VOICE_PROFILES[botKey] || VOICE_PROFILES.default;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        let matchVoice = null;
        if (profile.genderPref === 'female') {
            matchVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Victoria')));
        } else {
            matchVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('George') || v.name.includes('Alex')));
        }
        if (!matchVoice) matchVoice = voices.find(v => v.lang.startsWith('en'));
        if (matchVoice) utterance.voice = matchVoice;
    }

    window.speechSynthesis.speak(utterance);
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}
