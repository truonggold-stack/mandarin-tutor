// Translation Module
// Handles translation functionality between English and Mandarin

import { translationDictionary, apiEndpoints, getApiUrl } from './config.js';
import { saveTranslations, loadTranslations } from './storage.js';

// Module state
let currentTranslation = null;
let savedTranslations = [];

/**
 * Initialize the translation module
 */
export function initializeTranslation() {
    savedTranslations = loadTranslations();
    return savedTranslations;
}

/**
 * Check if Azure Translator is available via serverless function
 * @returns {boolean} Always returns true since we're using serverless functions
 */
export function isAzureTranslatorAvailable() {
    // With serverless functions, translation is always available
    // The server will handle Azure credentials
    return true;
}

/**
 * Translate text using serverless API (which calls Azure Translator)
 * @param {string} text - Text to translate
 * @param {string} fromLanguage - Source language code (default: 'en')
 * @param {string} toLanguage - Target language code (default: 'zh-Hans')
 * @returns {Promise<Object>} Translation result with text and pinyin
 */
async function translateWithAzure(text, fromLanguage = 'en', toLanguage = 'zh-Hans') {
    try {
        const apiUrl = getApiUrl(apiEndpoints.translate);
        
        console.log('Calling serverless translation API...', { text, fromLanguage, toLanguage });
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                fromLanguage,
                toLanguage
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Translation API error:', errorData);
            throw new Error(errorData.error || `Translation failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Translation API response:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Translation failed');
        }

        return {
            chinese: data.chinese,
            pinyin: data.pinyin,
            source: 'azure'
        };
        
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

/**
 * Translate an English word/phrase to Mandarin
 * First checks local dictionary, then falls back to Azure Translator if available
 * @param {string} english - English word or phrase
 * @param {boolean} useAzureFallback - Whether to use Azure as fallback (default: true)
 * @returns {Promise<Object|null>} Translation object with chinese, pinyin, emoji or null if not found
 */
export async function translateWord(english, useAzureFallback = true) {
    const normalized = english.trim().toLowerCase();
    const translation = translationDictionary[normalized];
    
    // First, check local dictionary
    if (translation) {
        currentTranslation = {
            english: normalized,
            chinese: translation.chinese,
            pinyin: translation.pinyin,
            emoji: translation.emoji || '📝',
            source: 'dictionary'
        };
        return currentTranslation;
    }
    
    // If not found in dictionary and Azure is available, use Azure Translator
    if (useAzureFallback && isAzureTranslatorAvailable()) {
        try {
            console.log(`Translation not found in dictionary for "${english}", using Azure Translator...`);
            const azureResult = await translateWithAzure(english);
            
            currentTranslation = {
                english: normalized,
                chinese: azureResult.chinese,
                pinyin: azureResult.pinyin,
                emoji: '🌐', // Special emoji for Azure translations
                source: 'azure'
            };
            return currentTranslation;
        } catch (error) {
            console.error('Azure translation failed:', error);
            // Fall through to return null if Azure fails
        }
    }
    
    return null;
}

/**
 * Translate an English word/phrase to Mandarin (synchronous, dictionary only)
 * Use this when you need immediate results without Azure fallback
 * @param {string} english - English word or phrase
 * @returns {Object|null} Translation object with chinese, pinyin, emoji or null if not found
 */
export function translateWordSync(english) {
    const normalized = english.trim().toLowerCase();
    const translation = translationDictionary[normalized];
    
    if (translation) {
        currentTranslation = {
            english: normalized,
            chinese: translation.chinese,
            pinyin: translation.pinyin,
            emoji: translation.emoji || '📝',
            source: 'dictionary'
        };
        return currentTranslation;
    }
    
    return null;
}

/**
 * Get the current translation (last translated)
 * @returns {Object|null} Current translation object
 */
export function getCurrentTranslation() {
    return currentTranslation;
}

/**
 * Add a translation to saved translations
 * @param {Object} translation - Translation object {english, chinese, pinyin}
 * @returns {boolean} True if added, false if already exists
 */
export function addTranslation(translation) {
    // Check if translation already exists
    const exists = savedTranslations.some(
        t => t.english === translation.english
    );
    
    if (exists) {
        return false;
    }
    
    savedTranslations.push({
        english: translation.english,
        chinese: translation.chinese,
        pinyin: translation.pinyin,
        emoji: translation.emoji || '📝',
        dateAdded: new Date().toISOString()
    });
    
    saveTranslations(savedTranslations);
    return true;
}

/**
 * Get all saved translations
 * @returns {Array} Array of translation objects
 */
export function getTranslations() {
    return [...savedTranslations];
}

/**
 * Remove a translation from saved translations
 * @param {string} english - English word to remove
 * @returns {boolean} True if removed, false if not found
 */
export function removeTranslation(english) {
    const initialLength = savedTranslations.length;
    savedTranslations = savedTranslations.filter(
        t => t.english !== english
    );
    
    if (savedTranslations.length < initialLength) {
        saveTranslations(savedTranslations);
        return true;
    }
    
    return false;
}

/**
 * Clear all saved translations
 */
export function clearTranslations() {
    savedTranslations = [];
    saveTranslations(savedTranslations);
}

/**
 * Get translation count
 * @returns {number} Number of saved translations
 */
export function getTranslationCount() {
    return savedTranslations.length;
}

/**
 * Check if a word exists in the dictionary
 * @param {string} english - English word to check
 * @returns {boolean} True if word exists in dictionary
 */
export function hasTranslation(english) {
    const normalized = english.trim().toLowerCase();
    return translationDictionary.hasOwnProperty(normalized);
}

/**
 * Get all available dictionary words
 * @returns {Array} Array of English words available for translation
 */
export function getDictionaryWords() {
    return Object.keys(translationDictionary);
}

/**
 * Search dictionary for words matching a pattern
 * @param {string} pattern - Search pattern
 * @returns {Array} Array of matching translation objects
 */
export function searchDictionary(pattern) {
    const regex = new RegExp(pattern, 'i');
    const results = [];
    
    for (const [english, translation] of Object.entries(translationDictionary)) {
        if (regex.test(english) || regex.test(translation.chinese) || regex.test(translation.pinyin)) {
            results.push({
                english,
                chinese: translation.chinese,
                pinyin: translation.pinyin,
                emoji: translation.emoji || '📝'
            });
        }
    }
    
    return results;
}

/**
 * Get translations by category (based on emoji or word type)
 * @param {string} category - Category filter
 * @returns {Array} Array of translations in category
 */
export function getTranslationsByCategory(category) {
    // This could be enhanced with category metadata in config
    // For now, returns all if no specific categorization
    return getDictionaryWords().map(english => ({
        english,
        ...translationDictionary[english]
    }));
}

/**
 * Export translations as JSON
 * @returns {string} JSON string of saved translations
 */
export function exportTranslations() {
    return JSON.stringify(savedTranslations, null, 2);
}

/**
 * Import translations from JSON
 * @param {string} jsonData - JSON string of translations
 * @returns {boolean} True if successful
 */
export function importTranslations(jsonData) {
    try {
        const imported = JSON.parse(jsonData);
        if (Array.isArray(imported)) {
            savedTranslations = imported;
            saveTranslations(savedTranslations);
            return true;
        }
    } catch (error) {
        console.error('Failed to import translations:', error);
    }
    return false;
}
