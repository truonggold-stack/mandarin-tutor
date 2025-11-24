// Netlify Function - Azure Speech Assessment Proxy
// This keeps your Azure API keys secure on the server side

const sdk = require("microsoft-cognitiveservices-speech-sdk");

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { audioData, referenceText } = JSON.parse(event.body);

    if (!audioData || !referenceText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: audioData and referenceText' 
        })
      };
    }

    // Get Azure credentials from environment variables
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const serviceRegion = process.env.AZURE_SPEECH_REGION || 'westus3';

    if (!subscriptionKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Azure Speech credentials not configured on server' 
        })
      };
    }

    // Configure Azure Speech SDK
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechRecognitionLanguage = 'zh-CN';

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // Create audio config from buffer
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer);
    pushStream.close();
    
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

    // Configure pronunciation assessment
    const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
      referenceText,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true
    );

    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationConfig.applyTo(recognizer);

    // Perform recognition
    const result = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          resolve(result);
        },
        (error) => {
          recognizer.close();
          reject(error);
        }
      );
    });

    // Check if recognition was successful
    if (result.reason === sdk.ResultReason.RecognizedSpeech) {
      const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);
      
      // Extract detailed assessment data
      const assessmentData = {
        accuracyScore: pronunciationResult.accuracyScore,
        pronunciationScore: pronunciationResult.pronunciationScore,
        completenessScore: pronunciationResult.completenessScore,
        fluencyScore: pronunciationResult.fluencyScore,
        recognizedText: result.text,
        words: pronunciationResult.words || []
      };

      // Calculate overall score
      const overallScore = (
        assessmentData.accuracyScore +
        assessmentData.pronunciationScore +
        assessmentData.completenessScore +
        assessmentData.fluencyScore
      ) / 4;

      // Convert to star rating (1-5)
      const stars = Math.min(5, Math.max(1, Math.round(overallScore / 20)));

      // Generate feedback message
      let feedback;
      if (stars >= 5) feedback = '🌟 Perfect! Excellent pronunciation!';
      else if (stars >= 4) feedback = '👍 Great job! Very close to perfect!';
      else if (stars >= 3) feedback = '😊 Good effort! Keep practicing!';
      else if (stars >= 2) feedback = '💪 Nice try! Practice makes perfect!';
      else feedback = '🎯 Keep going! Try again!';

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          stars,
          toneScore: Math.round(assessmentData.accuracyScore),
          clarityScore: Math.round(assessmentData.pronunciationScore),
          feedback,
          azureData: {
            ...assessmentData,
            overallScore: Math.round(overallScore)
          }
        })
      };
    } else {
      // Recognition failed
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Speech recognition failed',
          reason: result.reason
        })
      };
    }
  } catch (error) {
    console.error('Speech assessment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
