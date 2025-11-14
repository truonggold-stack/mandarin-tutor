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
        // Convert audio blob to base64
        const audioData = await blobToBase64(audioBlob);
        
        const apiUrl = getApiUrl(apiEndpoints.speechAssessment);
        
        console.log('Calling serverless speech assessment API...', { referenceText });
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audioData,
                referenceText
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Speech assessment API error:', errorData);
            console.warn('Falling back to simulated scoring');
            return generatePronunciationScore();
        }

        const data = await response.json();
        console.log('Speech assessment API response:', data);
        
        if (!data.success) {
            console.warn('Assessment failed, using fallback scoring');
            return generatePronunciationScore();
        }

        return {
            stars: data.stars,
            toneScore: data.toneScore,
            clarityScore: data.clarityScore,
            feedback: data.feedback,
            azureData: data.azureData
        };
        
    } catch (error) {
        console.error('Error during pronunciation assessment:', error);
        console.warn('Falling back to simulated scoring');
        return generatePronunciationScore();
    }
}

/**
 * Convert blob to base64 string
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
