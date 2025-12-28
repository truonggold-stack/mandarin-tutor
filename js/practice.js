// Practice Module
// Handles pronunciation practice exercises and assessment

import { speakChinese, startRecording, stopRecording, getIsRecording } from './audio.js';
import { addExerciseRating } from './lessons.js';
import { saveProgress, loadProgress } from './storage.js';
import { apiEndpoints, getApiUrl } from './config.js';

// Module state
let currentLesson = null;
let currentExerciseIndex = 0;
let exercises = [];
let progressData = null;

/**
 * Initialize practice module
 */
export function initializePractice() {
    progressData = loadProgress();
    return progressData;
}

/**
 * Check if Azure Speech assessment is available via serverless function
 * @returns {boolean} Always returns true since we're using serverless functions
 */
export function isAzureSpeechAvailable() {
    // With serverless functions, speech assessment is always available
    // The server will handle Azure Speech SDK and credentials
    return true;
}

/**
 * Load a lesson for practice
 * @param {Object} lesson - Lesson object
 */
export function loadLesson(lesson) {
    currentLesson = lesson;
    exercises = lesson.exercises || [];
    currentExerciseIndex = 0;
}

/**
 * Get current exercise
 * @returns {Object|null} Current exercise object
 */
export function getCurrentExercise() {
    if (!exercises || currentExerciseIndex >= exercises.length) {
        return null;
    }
    return exercises[currentExerciseIndex];
}

/**
 * Get exercise at specific index
 * @param {number} index - Exercise index
 * @returns {Object|null} Exercise object
 */
export function getExercise(index) {
    if (!exercises || index < 0 || index >= exercises.length) {
        return null;
    }
    return exercises[index];
}

/**
 * Move to next exercise
 * @returns {boolean} True if moved, false if at end
 */
export function nextExercise() {
    if (currentExerciseIndex < exercises.length - 1) {
        currentExerciseIndex++;
        return true;
    }
    return false;
}

/**
 * Move to previous exercise
 * @returns {boolean} True if moved, false if at beginning
 */
export function previousExercise() {
    if (currentExerciseIndex > 0) {
        currentExerciseIndex--;
        return true;
    }
    return false;
}

/**
 * Get current exercise index
 * @returns {number} Current index
 */
export function getCurrentIndex() {
    return currentExerciseIndex;
}

/**
 * Get total exercise count
 * @returns {number} Total exercises
 */
export function getExerciseCount() {
    return exercises.length;
}

/**
 * Play reference audio for current exercise
 */
export function playReference() {
    const exercise = getCurrentExercise();
    if (exercise) {
        speakChinese(exercise.chinese);
    }
}

/**
 * Start recording user's pronunciation
 * @param {Function} onStop - Callback when recording stops
 * @returns {Promise<boolean>} True if started successfully
 */
export async function startPracticeRecording(onStop) {
    return await startRecording(onStop);
}

/**
 * Stop recording user's pronunciation
 * @returns {boolean} True if stopped successfully
 */
export function stopPracticeRecording() {
    return stopRecording();
}

/**
 * Check if recording
 * @returns {boolean} True if recording
 */
export function isPracticeRecording() {
    return getIsRecording();
}

/**
 * Convert an audio Blob (webm/opus or other) to 16 kHz 16-bit PCM WAV base64 (no data: prefix)
 * Returns base64 string (no data: prefix)
 */
async function blobToWav16kBase64(blob) {
    // Read blob to ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();

    // Decode audio data into AudioBuffer using an (ephemeral) AudioContext
    const decodeAudio = async (ab) => {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        try {
            // Some browsers return a promise for decodeAudioData, others require callback
            const decoded = await ctx.decodeAudioData(ab.slice(0));
            try { ctx.close?.(); } catch {}
            return decoded;
        } catch (err) {
            // Fallback: callback form
            return await new Promise((resolve, reject) => {
                ctx.decodeAudioData(ab.slice(0),
                    (buffer) => {
                        try { ctx.close?.(); } catch {}
                        resolve(buffer);
                    },
                    (e) => {
                        try { ctx.close?.(); } catch {}
                        reject(e);
                    }
                );
            });
        }
    };

    const decoded = await decodeAudio(arrayBuffer);

    // Prepare an OfflineAudioContext to resample to 16000 Hz and mix to mono
    const targetRate = 16000;
    const channels = 1;
    const lengthInSamples = Math.ceil(decoded.duration * targetRate);
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtx(channels, lengthInSamples, targetRate);

    // Create a mono buffer and copy/mix decoded channels into it
    const tmp = offlineCtx.createBuffer(1, decoded.length, decoded.sampleRate);
    const tmpData = tmp.getChannelData(0);
    const inputChannels = decoded.numberOfChannels;
    for (let c = 0; c < inputChannels; c++) {
        const ch = decoded.getChannelData(c);
        for (let i = 0; i < decoded.length; i++) {
            tmpData[i] = tmpData[i] + ch[i] / inputChannels;
        }
    }

    // Source to play the mono buffer into offline context for resampling
    const source = offlineCtx.createBufferSource();
    source.buffer = tmp;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    const samples = rendered.getChannelData(0);

    // Build WAV (44-byte header + samples*2)
    const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(wavBuffer);

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true); // file size - 8
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, channels, true); // num channels
    view.setUint32(24, targetRate, true); // sample rate
    view.setUint32(28, targetRate * channels * 2, true); // byte rate
    view.setUint16(32, channels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    // Convert to base64
    const wavBlob = new Blob([view], { type: 'audio/wav' });
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(wavBlob);
    });

    return base64;
}

/**
 * Convert blob to base64 string (fallback)
 * @param {Blob} blob - Audio blob
 * @returns {Promise<string>} Base64 encoded audio data (no data: prefix)
 */
function blobToBase64Fallback(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Generate simulated pronunciation scores (fallback when Azure is not available)
 * (NOTE: keep existing generatePronunciationScore function if defined elsewhere — this file expects it)
 */
export function generatePronunciationScore() {
    const rand = Math.random();
    
    let stars, toneScore, clarityScore, feedback;
    
    if (rand > 0.6) {
        stars = rand > 0.8 ? 5 : 4;
        toneScore = Math.floor(Math.random() * 15) + 85; // 85-100
        clarityScore = Math.floor(Math.random() * 15) + 85; // 85-100
        feedback = '🌟 Nice! Good pronunciation.';
    } else if (rand > 0.3) {
        stars = 3;
        toneScore = Math.floor(Math.random() * 30) + 60; // 60-89
        clarityScore = Math.floor(Math.random() * 30) + 60; // 60-89
        feedback = '😊 Good effort! Some tones need work.';
    } else {
        stars = Math.floor(Math.random() * 2) + 1; // 1-2
        toneScore = Math.floor(Math.random() * 40) + 30; // 30-69
        clarityScore = Math.floor(Math.random() * 40) + 30; // 30-69
        feedback = '🎯 Keep practicing — you will improve!';
    }
    
    return {
        stars,
        toneScore,
        clarityScore,
        feedback,
        azureData: null
    };
}

/**
 * Assess pronunciation using serverless API (which calls Azure Speech SDK)
 * @param {Blob} audioBlob - Recorded audio blob
 * @param {string} referenceText - The expected Chinese text
 * @returns {Promise<Object>} Assessment result with scores
 */
export async function assessPronunciationWithAzure(audioBlob, referenceText) {
    try {
        // Prefer sending 16k WAV PCM for Azure speech SDK
        let audioData;
        let contentType = audioBlob.type || 'application/octet-stream';
        try {
            audioData = await blobToWav16kBase64(audioBlob);
            contentType = 'audio/wav';
        } catch (e) {
            console.warn('⚠️ blobToWav16kBase64 failed, falling back to direct base64:', e);
            audioData = await blobToBase64Fallback(audioBlob);
            // contentType remains the original blob.type (e.g., audio/webm)
        }
        
        const apiUrl = getApiUrl(apiEndpoints.speechAssessment);
        
        console.log('🎤 Calling serverless speech assessment API...', { 
            referenceText, 
            apiUrl,
            audioDataSize: audioData.length,
            contentType
        });
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audioData,
                referenceText,
                contentType
            })
        });

        console.log('📡 API Response Status:', response.status, response.statusText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('❌ Speech assessment API error:', errorData);
            console.warn('⚠️ Falling back to simulated scoring. Reason:', errorData.error || 'HTTP Error');
            return generatePronunciationScore();
        }

        const data = await response.json();
        console.log('✅ Speech assessment API response:', data);
        
        // Check for Azure SDK errors
        if (data.reason === 'RecognitionFailed') {
            console.warn('⚠️ Azure Speech SDK failed - check if audio quality is good');
            return generatePronunciationScore();
        }
        
        if (!data.success) {
            console.warn('⚠️ Assessment failed (success: false), using fallback scoring');
            console.warn('   Error reason:', data.error || 'Unknown');
            return generatePronunciationScore();
        }

        // Validate Azure response has required fields (allow zero values)
        const hasRequiredFields = ['stars','toneScore','clarityScore']
            .every(k => data[k] !== undefined && data[k] !== null);
        if (!hasRequiredFields) {
            console.warn('⚠️ Azure response missing required fields (allowing zeros):', {
                stars: data.stars,
                toneScore: data.toneScore,
                clarityScore: data.clarityScore
            });
            // Proceed but ensure safe defaults
        }

        console.log('🎉 Using Azure assessment scores:', {
            stars: data.stars,
            toneScore: data.toneScore,
            clarityScore: data.clarityScore
        });

        return {
            stars: Number.isFinite(data.stars) ? data.stars : 0,
            toneScore: Number.isFinite(data.toneScore) ? data.toneScore : 0,
            clarityScore: Number.isFinite(data.clarityScore) ? data.clarityScore : 0,
            feedback: data.feedback || 'Assessment complete',
            azureData: data.azureData || null
        };
        
    } catch (error) {
        console.error('❌ Error during pronunciation assessment:', error);
        console.warn('⚠️ Falling back to simulated scoring');
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn('   Hint: Network/CORS issue. Check if API is deployed and accessible.');
        }
        return generatePronunciationScore();
    }
}
// Save pronunciation rating
// @param {Object} rating - { stars, tone, clarity, notes }
// @returns {boolean} True if saved successfully
export function savePronunciationRating(rating) {
    // currentLesson, currentExerciseIndex and progressData are module-level vars in practice.js
    if (!currentLesson) return false;

    // addExerciseRating is already imported from lessons.js at top of the file
    const success = addExerciseRating(
        currentLesson.id,
        currentExerciseIndex,
        rating
    );

    if (success) {
        // Ensure progressData fields exist
        progressData.totalExercises = (progressData.totalExercises || 0) + 1;
        progressData.totalScore = (progressData.totalScore || 0) + ((rating.stars || 0) / 5) * 100;
        saveProgress(progressData); // saveProgress is already imported in practice.js
    }

    return success;
}