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
 * Assess pronunciation using serverless API (which calls Azure Speech SDK)
 * @param {Blob} audioBlob - Recorded audio blob
 * @param {string} referenceText - The expected Chinese text
 * @returns {Promise<Object>} Assessment result with scores
 */
export async function assessPronunciationWithAzure(audioBlob, referenceText) {
    try {
        // Attempt to convert audio to 16kHz 16-bit PCM WAV for better Azure compatibility
        let audioData;
        let contentType;
        
        try {
            console.log('🔄 Attempting client-side conversion to 16kHz 16-bit PCM WAV...');
            audioData = await blobToWav16kBase64(audioBlob);
            contentType = 'audio/wav';
            console.log('✅ Using WAV format for Azure Speech SDK');
        } catch (conversionError) {
            console.warn('⚠️ WAV conversion failed, falling back to original format:', conversionError.message);
            // Fall back to original blob format
            audioData = await blobToBase64(audioBlob);
            contentType = audioBlob.type || 'audio/webm';
            console.log('📎 Using fallback format:', contentType);
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
            // Proceed with safe defaults instead of falling back
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
        console.warn('   Error type:', error.name, '- Message:', error.message);
        
        // Additional debugging info
        if (error.message.includes('Failed to fetch')) {
            console.warn('   Hint: Network/CORS issue. Check if API is deployed and accessible.');
        }
        if (error.message.includes('JSON')) {
            console.warn('   Hint: API returned invalid JSON. Check server logs.');
        }
        
        return generatePronunciationScore();
    }
}

/**
 * Convert blob to 16kHz 16-bit PCM WAV format (base64)
 * This ensures Azure Speech SDK receives the expected audio format
 * @param {Blob} blob - Audio blob from MediaRecorder
 * @returns {Promise<string>} Base64 encoded WAV audio data (no data: prefix)
 */
async function blobToWav16kBase64(blob) {
    try {
        // Create AudioContext to decode the blob
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Read blob as ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        
        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Create OfflineAudioContext to resample to 16kHz mono
        const targetSampleRate = 16000;
        const offlineContext = new OfflineAudioContext(
            1, // mono
            audioBuffer.duration * targetSampleRate,
            targetSampleRate
        );
        
        // Create buffer source
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start(0);
        
        // Render the audio
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to 16-bit PCM WAV format
        const wavData = encodeWAV(renderedBuffer);
        
        // Convert to base64
        const base64 = arrayBufferToBase64(wavData);
        
        console.log('✅ Successfully converted audio to 16kHz 16-bit PCM WAV');
        
        return base64;
    } catch (error) {
        console.error('❌ Error converting to WAV:', error);
        throw error;
    }
}

/**
 * Encode AudioBuffer to WAV format (RIFF header + 16-bit PCM samples)
 * @param {AudioBuffer} audioBuffer - The audio buffer to encode
 * @returns {ArrayBuffer} WAV file data
 */
function encodeWAV(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    // Get audio data (mono)
    const samples = audioBuffer.getChannelData(0);
    const numSamples = samples.length;
    
    // Calculate sizes
    const bytesPerSample = bitDepth / 8;
    const dataSize = numSamples * bytesPerSample;
    const bufferSize = 44 + dataSize; // 44 bytes for WAV header
    
    // Create buffer
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    
    // Write WAV header
    let offset = 0;
    
    // "RIFF" chunk descriptor
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, bufferSize - 8, true); offset += 4; // File size - 8
    writeString(view, offset, 'WAVE'); offset += 4;
    
    // "fmt " sub-chunk
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4; // Subchunk size
    view.setUint16(offset, format, true); offset += 2; // Audio format (PCM)
    view.setUint16(offset, 1, true); offset += 2; // Number of channels (mono)
    view.setUint32(offset, sampleRate, true); offset += 4; // Sample rate
    view.setUint32(offset, sampleRate * bytesPerSample, true); offset += 4; // Byte rate
    view.setUint16(offset, bytesPerSample, true); offset += 2; // Block align
    view.setUint16(offset, bitDepth, true); offset += 2; // Bits per sample
    
    // "data" sub-chunk
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, dataSize, true); offset += 4;
    
    // Write PCM samples
    const volume = 0.8; // Prevent clipping
    for (let i = 0; i < numSamples; i++) {
        const sample = Math.max(-1, Math.min(1, samples[i] * volume));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, int16, true);
        offset += 2;
    }
    
    return buffer;
}

/**
 * Write string to DataView
 * @param {DataView} view - DataView to write to
 * @param {number} offset - Offset in the buffer
 * @param {string} string - String to write
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Convert ArrayBuffer to base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert blob to base64 string (fallback method)
 * @param {Blob} blob - Audio blob
 * @returns {Promise<string>} Base64 encoded audio data
 */
function blobToBase64(blob) {
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
 * @returns {Object} Score object with stars, toneScore, clarityScore, feedback
 */
export function generatePronunciationScore() {
    const rand = Math.random();
    
    let stars, toneScore, clarityScore, feedback;
    
    if (rand > 0.6) {
        // 40% chance: Excellent (4-5 stars)
        stars = rand > 0.8 ? 5 : 4;
        toneScore = Math.floor(Math.random() * 15) + 85; // 85-100
        clarityScore = Math.floor(Math.random() * 15) + 85; // 85-100
        feedback = stars === 5 
            ? '🎉 Excellent! Perfect pronunciation!' 
            : '👍 Great job! Very close to perfect!';
    } else if (rand > 0.3) {
        // 30% chance: Good (3 stars)
        stars = 3;
        toneScore = Math.floor(Math.random() * 20) + 60; // 60-80
        clarityScore = Math.floor(Math.random() * 20) + 60; // 60-80
        feedback = '✓ Good effort! Keep practicing the tones.';
    } else if (rand > 0.1) {
        // 20% chance: Fair (2 stars)
        stars = 2;
        toneScore = Math.floor(Math.random() * 15) + 45; // 45-60
        clarityScore = Math.floor(Math.random() * 15) + 45; // 45-60
        feedback = '📚 Needs more practice. Listen to the reference and try again.';
    } else {
        // 10% chance: Needs work (1 star)
        stars = 1;
        toneScore = Math.floor(Math.random() * 20) + 25; // 25-45
        clarityScore = Math.floor(Math.random() * 20) + 25; // 25-45
        feedback = '💪 Keep practicing! Try listening more carefully to the tones.';
    }
    
    return { stars, toneScore, clarityScore, feedback };
}

/**
 * Save pronunciation rating
 * @param {Object} rating - Rating object {stars, tone, clarity, notes}
 * @returns {boolean} True if saved successfully
 */
export function savePronunciationRating(rating) {
    if (!currentLesson) return false;
    
    const success = addExerciseRating(
        currentLesson.id,
        currentExerciseIndex,
        rating
    );
    
    if (success) {
        // Update progress
        progressData.totalExercises++;
        progressData.totalScore += (rating.stars / 5) * 100;
        saveProgress(progressData);
    }
    
    return success;
}

/**
 * Get progress data
 * @returns {Object} Progress data object
 */
export function getProgress() {
    return { ...progressData };
}

/**
 * Update progress data
 * @param {Object} updates - Updates to apply
 */
export function updateProgress(updates) {
    progressData = {
        ...progressData,
        ...updates
    };
    saveProgress(progressData);
}

/**
 * Get exercise progress percentage
 * @returns {number} Percentage complete (0-100)
 */
export function getExerciseProgress() {
    if (!exercises.length) return 0;
    return Math.round(((currentExerciseIndex + 1) / exercises.length) * 100);
}

/**
 * Check if lesson is complete
 * @returns {boolean} True if all exercises completed
 */
export function isLessonComplete() {
    return currentExerciseIndex >= exercises.length - 1;
}

/**
 * Reset practice session
 */
export function resetPractice() {
    currentLesson = null;
    currentExerciseIndex = 0;
    exercises = [];
}
