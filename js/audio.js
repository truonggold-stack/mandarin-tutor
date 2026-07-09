// Audio Module
// Handles audio playback, speech synthesis, and recording

// Module state
let audioContext = null;
let mediaRecorder = null;
let isRecording = false;
let recordedChunks = [];
let recordedMimeType = '';

/**
 * Ensure audio context exists and is running.
 * @returns {AudioContext|null} Active audio context
 */
function getActiveAudioContext() {
    if (!audioContext) {
        initializeAudio();
    }

    if (!audioContext) {
        return null;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
            // Ignore resume failures; caller handles null-like behavior.
        });
    }

    return audioContext;
}

/**
 * Initialize audio context
 */
export function initializeAudio() {
    try {
        if (typeof AudioContext !== 'undefined') {
            audioContext = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
            audioContext = new webkitAudioContext();
        }
        return true;
    } catch (error) {
        console.error('Failed to initialize audio:', error);
        return false;
    }
}

/**
 * Speak Chinese text using speech synthesis
 * @param {string} text - Chinese text to speak
 * @param {number} rate - Speech rate (default 0.8)
 */
export function speakChinese(text, rate = 0.8) {
    if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported');
        return false;
    }
    
    try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = rate;
        window.speechSynthesis.speak(utterance);
        return true;
    } catch (error) {
        console.error('Failed to speak:', error);
        return false;
    }
}

/**
 * Speak English text using speech synthesis
 * @param {string} text - English text to speak
 * @param {number} rate - Speech rate (default 1.0)
 */
export function speakEnglish(text, rate = 1.0) {
    if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported');
        return false;
    }
    
    try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        window.speechSynthesis.speak(utterance);
        return true;
    } catch (error) {
        console.error('Failed to speak:', error);
        return false;
    }
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Start recording audio
 * @param {Function} onStop - Callback function when recording stops
 * @returns {Promise<boolean>} True if recording started successfully
 */
export async function startRecording(onStop) {
    if (isRecording) {
        console.warn('Already recording');
        return false;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
                // Capture the true mime type from MediaRecorder
                if (!recordedMimeType && e.data.type) {
                    recordedMimeType = e.data.type;
                }
            }
        };
        
        mediaRecorder.onstop = () => {
            // Use the actual recorded mime type rather than forcing WAV
            const blobType = recordedMimeType || 'audio/webm';
            const audioBlob = new Blob(recordedChunks, { type: blobType });
            const audioUrl = URL.createObjectURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
            
            if (onStop) {
                onStop(audioUrl, audioBlob);
            }
        };
        
        mediaRecorder.start();
        isRecording = true;
        return true;
    } catch (error) {
        console.error('Failed to start recording:', error);
        return false;
    }
}

/**
 * Stop recording audio
 * @returns {boolean} True if recording stopped successfully
 */
export function stopRecording() {
    if (!isRecording || !mediaRecorder) {
        console.warn('Not currently recording');
        return false;
    }
    
    try {
        mediaRecorder.stop();
        isRecording = false;
        recordedMimeType = '';
        return true;
    } catch (error) {
        console.error('Failed to stop recording:', error);
        return false;
    }
}

/**
 * Check if currently recording
 * @returns {boolean} True if recording
 */
export function getIsRecording() {
    return isRecording;
}

/**
 * Play audio from URL
 * @param {string} audioUrl - URL of audio to play
 * @returns {Promise<boolean>} True if playback started
 */
export async function playAudio(audioUrl) {
    try {
        const audio = new Audio(audioUrl);
        await audio.play();
        return true;
    } catch (error) {
        console.error('Failed to play audio:', error);
        return false;
    }
}

/**
 * Create audio element and return it
 * @param {string} audioUrl - URL of audio
 * @returns {HTMLAudioElement} Audio element
 */
export function createAudioElement(audioUrl) {
    return new Audio(audioUrl);
}

/**
 * Check if speech synthesis is supported
 * @returns {boolean} True if supported
 */
export function isSpeechSynthesisSupported() {
    return 'speechSynthesis' in window;
}

/**
 * Check if media recording is supported
 * @returns {boolean} True if supported
 */
export function isMediaRecordingSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Get available voices for speech synthesis
 * @returns {Array} Array of available voices
 */
export function getAvailableVoices() {
    if (!isSpeechSynthesisSupported()) {
        return [];
    }
    return window.speechSynthesis.getVoices();
}

/**
 * Get Chinese voices specifically
 * @returns {Array} Array of Chinese voices
 */
export function getChineseVoices() {
    const voices = getAvailableVoices();
    return voices.filter(voice => voice.lang.startsWith('zh'));
}

/**
 * Play simple synthesized game sound effects.
 * @param {'hit'|'miss'} type - Sound effect type
 */
export function playGameSfx(type) {
    const ctx = getActiveAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const createTone = (frequency, duration, gainValue, waveType = 'sine', start = 0) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = waveType;
        osc.frequency.setValueAtTime(frequency, now + start);

        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(gainValue, now + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration + 0.02);
    };

    if (type === 'hit') {
        // Bright two-note pop/chime
        createTone(680, 0.11, 0.11, 'triangle', 0);
        createTone(940, 0.16, 0.09, 'sine', 0.06);
        return;
    }

    if (type === 'miss') {
        // Gentle low "boop" for misses
        createTone(240, 0.14, 0.08, 'sine', 0);
    }
}
