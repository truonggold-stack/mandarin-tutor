#!/usr/bin/env node

/**
 * Local Development Server for Mandarin Tutor
 * Serves static files + API endpoints for Azure Speech Assessment
 * Run: AZURE_SPEECH_KEY="..." AZURE_SPEECH_REGION="..." node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');
const { spawn } = require('child_process');

// Try to load Azure Speech SDK
let speechSdk = null;
try {
    speechSdk = require('microsoft-cognitiveservices-speech-sdk');
    console.log('✅ Azure Speech SDK loaded');
} catch (error) {
    console.warn('⚠️  Azure Speech SDK not installed. Install with: npm install microsoft-cognitiveservices-speech-sdk');
    console.warn('    Running in demo mode only.');
}

// Try to load ffmpeg for audio conversion
let ffmpegPath = null;
try {
    ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) {
        console.log('✅ ffmpeg-static loaded');
    }
} catch (error) {
    console.warn('⚠️  ffmpeg-static not installed. Install with: npm install ffmpeg-static');
}

const PORT = process.env.PORT || 8000;

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// Create server
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Log request
    console.log(`${req.method} ${pathname}`);

    try {
        // Handle API routes
        if (pathname.startsWith('/api/')) {
            await handleApiRequest(req, res, pathname);
            return;
        }

        // Handle static files
        if (pathname === '/') {
            pathname = '/index.html';
        }

        const filePath = path.join(__dirname, pathname);
        
        // Security: prevent directory traversal
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        // Get file extension and MIME type
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Serve file
        const fileContent = fs.readFileSync(filePath);
        
        // Add cache control headers - no cache for HTML/JS, cache CSS/fonts
        let headers = { 'Content-Type': contentType };
        if (pathname.endsWith('.js') || pathname.endsWith('.html')) {
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            headers['Pragma'] = 'no-cache';
            headers['Expires'] = '0';
        } else if (pathname.endsWith('.css') || pathname.endsWith('.woff') || pathname.endsWith('.woff2')) {
            headers['Cache-Control'] = 'public, max-age=31536000';
        }
        
        res.writeHead(200, headers);
        res.end(fileContent);

    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

/**
 * Handle API requests
 */
async function handleApiRequest(req, res, pathname) {
    if (pathname === '/api/speech-assessment') {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        // Read request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { audioData, referenceText, contentType } = data;

                if (!audioData || !referenceText) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing audioData or referenceText' }));
                    return;
                }

                // Check if Azure credentials are available
                const azureKey = process.env.AZURE_SPEECH_KEY;
                const azureRegion = process.env.AZURE_SPEECH_REGION;

                if (!azureKey || !azureRegion) {
                    console.warn('⚠️  Azure credentials not configured - returning demo scores');
                    const demoScore = generateDemoScore();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        ...demoScore,
                        azureData: {
                            recognizedText: referenceText,
                            accuracyScore: demoScore.toneScore,
                            pronunciationScore: demoScore.clarityScore,
                            completenessScore: demoScore.toneScore,
                            fluencyScore: demoScore.clarityScore,
                            overallScore: Math.round((demoScore.toneScore + demoScore.clarityScore) / 2),
                            words: []
                        },
                        note: '✅ Demo scoring. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION for real scoring.'
                    }));
                    return;
                }

                // If Azure SDK is not available, can't use real scoring
                if (!speechSdk) {
                    console.error('❌ Azure Speech SDK not installed');
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Azure Speech SDK not installed. Run: npm install microsoft-cognitiveservices-speech-sdk'
                    }));
                    return;
                }

                // Use real Azure Speech SDK
                await assessWithAzure(audioData, referenceText, azureKey, azureRegion, res, contentType);

            } catch (error) {
                console.error('API error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                }));
            }
        });

    } else if (pathname === '/api/translate') {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        // Read request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { text, fromLanguage = 'en', toLanguage = 'zh-Hans' } = data;

                if (!text) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing text parameter' }));
                    return;
                }

                // Get Azure credentials
                const translatorKey = process.env.AZURE_TRANSLATOR_KEY;
                const translatorRegion = process.env.AZURE_TRANSLATOR_REGION || 'westus';

                if (!translatorKey) {
                    console.warn('⚠️  AZURE_TRANSLATOR_KEY not set - cannot translate');
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Translation service not configured'
                    }));
                    return;
                }

                // Call Azure Translator
                const endpoint = 'https://api.cognitive.microsofttranslator.com';
                const url = `${endpoint}/translate?api-version=3.0&from=${fromLanguage}&to=${toLanguage}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': translatorKey,
                        'Ocp-Apim-Subscription-Region': translatorRegion,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{ text }])
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('❌ Azure Translator error:', errorData);
                    res.writeHead(response.status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Translation failed',
                        details: errorData
                    }));
                    return;
                }

                const translationData = await response.json();

                if (!translationData || translationData.length === 0 || !translationData[0].translations) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Invalid response from Azure Translator'
                    }));
                    return;
                }

                const translation = translationData[0].translations[0];

                // Try to get pinyin using transliteration
                let pinyin = '';
                try {
                    const pinyinUrl = `${endpoint}/transliterate?api-version=3.0&language=zh-Hans&fromScript=Hans&toScript=Latn`;
                    const pinyinResponse = await fetch(pinyinUrl, {
                        method: 'POST',
                        headers: {
                            'Ocp-Apim-Subscription-Key': translatorKey,
                            'Ocp-Apim-Subscription-Region': translatorRegion,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify([{ text: translation.text }])
                    });

                    if (pinyinResponse.ok) {
                        const pinyinData = await pinyinResponse.json();
                        if (pinyinData && pinyinData.length > 0) {
                            pinyin = pinyinData[0].text;
                        }
                    }
                } catch (pinyinError) {
                    console.warn('⚠️  Pinyin generation failed:', pinyinError.message);
                    pinyin = translation.text;
                }

                console.log(`✅ Translated "${text}" to "${translation.text}"`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    english: text,
                    chinese: translation.text,
                    pinyin: pinyin || translation.text,
                    emoji: '🌐',
                    source: 'azure'
                }));

            } catch (error) {
                console.error('❌ Translation error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
            }
        });

    } else if (pathname === '/api/save-shared-lessons') {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        // Security guard: only allow local requests to write repository files.
        if (!isLocalRequest(req)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Forbidden: local access only'
            }));
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const incomingLessons = data.lessons;

                if (!Array.isArray(incomingLessons)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Missing lessons array'
                    }));
                    return;
                }

                const targetPath = path.join(__dirname, 'data', 'shared-lessons.json');
                fs.writeFileSync(targetPath, JSON.stringify(incomingLessons, null, 2) + '\n', 'utf8');

                console.log(`✅ Saved ${incomingLessons.length} shared lesson(s) to data/shared-lessons.json`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    lessonCount: incomingLessons.length,
                    filePath: 'data/shared-lessons.json'
                }));
            } catch (error) {
                console.error('❌ Failed to save shared lessons:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
            }
        });

    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
    }
}

/**
 * Restrict privileged API calls to local loopback requests only.
 */
function isLocalRequest(req) {
    const remoteAddress = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : '';
    return remoteAddress === '127.0.0.1'
        || remoteAddress === '::1'
        || remoteAddress === '::ffff:127.0.0.1';
}

/**
 * Generate demo pronunciation scores for testing
 */
function generateDemoScore() {
    const rand = Math.random();
    
    let stars, toneScore, clarityScore, feedback;
    
    if (rand > 0.6) {
        stars = rand > 0.8 ? 5 : 4;
        toneScore = Math.floor(Math.random() * 15) + 85;
        clarityScore = Math.floor(Math.random() * 15) + 85;
        feedback = stars === 5 
            ? '🎉 Excellent! Perfect pronunciation!' 
            : '👍 Great job! Very close to perfect!';
    } else if (rand > 0.3) {
        stars = 3;
        toneScore = Math.floor(Math.random() * 20) + 60;
        clarityScore = Math.floor(Math.random() * 20) + 60;
        feedback = '✓ Good effort! Keep practicing the tones.';
    } else if (rand > 0.1) {
        stars = 2;
        toneScore = Math.floor(Math.random() * 15) + 45;
        clarityScore = Math.floor(Math.random() * 15) + 45;
        feedback = '📚 Needs more practice. Listen to the reference and try again.';
    } else {
        stars = 1;
        toneScore = Math.floor(Math.random() * 20) + 25;
        clarityScore = Math.floor(Math.random() * 20) + 25;
        feedback = '💪 Keep practicing! Try listening more carefully to the tones.';
    }
    
    return { stars, toneScore, clarityScore, feedback };
}

/**
 * Assess pronunciation using Azure Speech SDK
 */
async function assessWithAzure(audioData, referenceText, subscriptionKey, region, res, contentType) {
    try {
        console.log('🔵 Using Azure Speech SDK for assessment...');
        
        // Convert base64 audio to buffer
        const audioBuffer = Buffer.from(audioData, 'base64');
        console.log('📦 Received audio buffer length:', audioBuffer.length, 'contentType:', contentType);

        // If we have ffmpeg, convert to WAV PCM 16k mono
        let wavBuffer = audioBuffer;
        let wavPath = null;
        if (ffmpegPath) {
            try {
                const converted = await convertToWavPCM(audioBuffer, contentType);
                if (!converted || !converted.buffer) {
                    console.warn('⚠️  Audio conversion returned invalid result');
                    wavBuffer = audioBuffer;
                } else {
                    wavBuffer = converted.buffer;
                    wavPath = converted.path;
                    console.log('🎛️ Converted audio to WAV PCM, length:', wavBuffer.length, 'path:', wavPath);
                }
            } catch (convErr) {
                console.warn('⚠️  Audio conversion failed, using original buffer:', convErr.message);
                wavBuffer = audioBuffer;
            }
        }

        // Validate wavBuffer
        if (!wavBuffer) {
            console.error('❌ wavBuffer is null or undefined!');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Failed to process audio buffer'
            }));
            return;
        }

        // Configure Azure Speech
        const speechConfig = speechSdk.SpeechConfig.fromSubscription(
            subscriptionKey,
            region
        );
        speechConfig.speechRecognitionLanguage = 'zh-CN';

        // In Node.js, always use push stream (fromWavFileInput is for browser)
        console.log('📡 Using push stream for audio input, buffer length:', wavBuffer.length);
        const pushStream = speechSdk.AudioInputStream.createPushStream(speechSdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1));
        // Convert Buffer to ArrayBuffer for push stream
        const arrayBuffer = wavBuffer.buffer.slice(wavBuffer.byteOffset, wavBuffer.byteOffset + wavBuffer.byteLength);
        pushStream.write(arrayBuffer);
        pushStream.close();
        const audioConfig = speechSdk.AudioConfig.fromStreamInput(pushStream);

        // Configure pronunciation assessment
        const pronunciationConfig = new speechSdk.PronunciationAssessmentConfig(
            referenceText,
            speechSdk.PronunciationAssessmentGradingSystem.HundredMark,
            speechSdk.PronunciationAssessmentGranularity.Phoneme,
            true
        );
        pronunciationConfig.enableMiscue = true;

        // Create recognizer
        const recognizer = new speechSdk.SpeechRecognizer(speechConfig, audioConfig);
        pronunciationConfig.applyTo(recognizer);

        // Perform recognition
        recognizer.recognizeOnceAsync(
            (result) => {
                recognizer.close();
                // Cleanup temp wav file if it was created
                if (wavPath && fs.existsSync(wavPath)) {
                    fs.unlink(wavPath, () => {});
                }
                handleAzureResult(result, referenceText, res);
            },
            (error) => {
                recognizer.close();
                // Cleanup temp wav file if it was created
                if (wavPath && fs.existsSync(wavPath)) {
                    fs.unlink(wavPath, () => {});
                }
                console.error('❌ Azure Speech SDK error:', error);
                
                // Fallback to demo scores on error
                console.warn('⚠️  Falling back to demo scores');
                const demoScore = generateDemoScore();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    ...demoScore,
                    azureData: {
                        recognizedText: referenceText,
                        accuracyScore: demoScore.toneScore,
                        pronunciationScore: demoScore.clarityScore,
                        completenessScore: demoScore.toneScore,
                        fluencyScore: demoScore.clarityScore,
                        overallScore: Math.round((demoScore.toneScore + demoScore.clarityScore) / 2),
                        words: []
                    },
                    note: `⚠️ Error: ${error.message}. Using fallback scores.`
                }));
            }
        );

    } catch (error) {
        console.error('❌ Azure assessment error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: error.message
        }));
    }
}

/**
 * Convert incoming audio buffer to WAV PCM 16k mono using ffmpeg
 */
function convertToWavPCM(inputBuffer, contentType) {
    return new Promise((resolve, reject) => {
        if (!ffmpegPath) {
            return resolve({ buffer: inputBuffer, path: null });
        }

        const ext = (contentType || '').includes('ogg') ? '.ogg'
            : (contentType || '').includes('wav') ? '.wav'
            : '.webm';
        const inFile = path.join(os.tmpdir(), `mt-audio-in-${Date.now()}${ext}`);
        const outFile = path.join(os.tmpdir(), `mt-audio-out-${Date.now()}.wav`);

        try {
            fs.writeFileSync(inFile, inputBuffer);
        } catch (e) {
            return reject(e);
        }

        const args = ['-y', '-i', inFile, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', outFile];
        const ff = spawn(ffmpegPath, args);
        let stderr = '';
        ff.stderr.on('data', d => { stderr += d.toString(); });
        ff.on('error', (err) => reject(err));
        ff.on('close', (code) => {
            try {
                if (code !== 0) {
                    return reject(new Error(`ffmpeg exit code ${code}: ${stderr}`));
                }
                const outBuf = fs.readFileSync(outFile);
                // cleanup input only (leave wav for Azure stream input)
                fs.unlink(inFile, () => {});
                resolve({ buffer: outBuf, path: outFile });
            } catch (readErr) {
                reject(readErr);
            }
        });
    });
}

/**
 * Handle Azure Speech SDK results
 */
function handleAzureResult(result, referenceText, res) {
    if (result.reason === speechSdk.ResultReason.RecognizedSpeech) {
        console.log('✅ Azure recognized:', result.text);
        
        try {
            const pronunciationResult = speechSdk.PronunciationAssessmentResult.fromResult(result);

            // Extract scores
            const accuracyScore = Math.round(pronunciationResult.accuracyScore || 0);
            const pronunciationScore = Math.round(pronunciationResult.pronunciationScore || 0);
            const completenessScore = Math.round(pronunciationResult.completenessScore || 0);
            const fluencyScore = Math.round(pronunciationResult.fluencyScore || 0);

            // Calculate overall score
            const overallScore = Math.round(
                (accuracyScore + pronunciationScore + completenessScore + fluencyScore) / 4
            );

            // Convert to stars (1-5)
            const stars = Math.min(5, Math.max(1, Math.round(overallScore / 20)));

            // Generate feedback
            let feedback;
            if (stars >= 5) feedback = '🌟 Perfect! Excellent pronunciation!';
            else if (stars >= 4) feedback = '👍 Great job! Very close to perfect!';
            else if (stars >= 3) feedback = '😊 Good effort! Keep practicing!';
            else if (stars >= 2) feedback = '💪 Nice try! Practice makes perfect!';
            else feedback = '🎯 Keep going! Try again!';

            console.log(`✨ Assessment: ${stars} stars, Overall: ${overallScore}%`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                stars,
                toneScore: accuracyScore,
                clarityScore: pronunciationScore,
                feedback,
                azureData: {
                    recognizedText: result.text,
                    accuracyScore,
                    pronunciationScore,
                    completenessScore,
                    fluencyScore,
                    overallScore,
                    words: pronunciationResult.words || []
                }
            }));

        } catch (error) {
            console.error('❌ Error parsing pronunciation result:', error);
            
            // Fallback
            const demoScore = generateDemoScore();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                ...demoScore,
                azureData: {
                    recognizedText: result.text,
                    note: 'Parse error, using fallback'
                }
            }));
        }

    } else if (result.reason === speechSdk.ResultReason.NoMatch) {
        console.warn('⚠️  Azure: No match found');
        
        // Return demo scores
        const demoScore = generateDemoScore();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            ...demoScore,
            azureData: {
                recognizedText: '(not recognized)',
                note: 'Speech not recognized. Try again with clearer pronunciation.'
            }
        }));

    } else {
        console.error('❌ Azure error:', result.errorDetails);
        
        // Return error
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: result.errorDetails || 'Unknown error'
        }));
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🎓 Mandarin Tutor Dev Server          ║
╚════════════════════════════════════════╝

🌐 Server running at: http://localhost:${PORT}

📝 Available endpoints:
   • GET  /                    → index.html
   • POST /api/speech-assessment → Pronunciation assessment
   • POST /api/translate         → Translation (todo)

${process.env.AZURE_SPEECH_KEY ? '✅ Azure credentials configured' : '📖 Using demo scores (set AZURE_SPEECH_KEY & AZURE_SPEECH_REGION for real scoring)'}
${ffmpegPath ? '✅ ffmpeg available for audio conversion' : '⚠️ ffmpeg not available; using raw audio bytes'}

Press Ctrl+C to stop
    `);
});
