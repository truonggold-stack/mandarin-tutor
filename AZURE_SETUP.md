# Azure Services Setup Guide

This guide explains how to set up Azure services for the Mandarin Tutor application, including Speech Services for pronunciation assessment and Translator for real-time translation.

## Overview

The Mandarin Tutor now supports two Azure services:

### Azure Speech SDK
- **Real-time pronunciation scoring** based on native Chinese speech patterns
- **Tone accuracy assessment** for Mandarin tones
- **Word-level feedback** highlighting specific words that need improvement
- **Professional-grade assessment** using Microsoft's advanced speech recognition

### Azure Translator
- **Real-time translation** for any English text to Mandarin Chinese
- **Automatic pinyin generation** for pronunciation guidance
- **Unlimited vocabulary** beyond the built-in dictionary
- **Professional translation quality** using neural machine translation

## Prerequisites

1. An Azure account (free tier available)
2. Azure Speech Service resource (for pronunciation assessment)
3. Azure Translator resource (for real-time translation)

## Setup Instructions

## Part 1: Azure Speech Service (Pronunciation Assessment)

### Step 1: Create Azure Speech Service Resource

1. Go to the [Azure Portal](https://portal.azure.com)
2. Click **Create a resource**
3. Search for **Speech** or **Cognitive Services**
4. Select **Speech** service
5. Click **Create**
6. Fill in the required information:
   - **Subscription**: Choose your subscription
   - **Resource Group**: Create new or use existing
   - **Region**: Choose a region close to your users (e.g., `westus`, `eastus`, `southeastasia`)
   - **Name**: Give your resource a unique name
   - **Pricing Tier**: Choose **Free F0** (for testing) or **Standard S0** (for production)
7. Click **Review + Create**, then **Create**

### Step 2: Get Your Credentials

1. Once deployment is complete, go to your Speech resource
2. In the left menu, click **Keys and Endpoint**
3. Copy one of the keys (Key 1 or Key 2)
4. Note the **Region** (e.g., `westus`, `eastus`)

### Step 3: Configure the Application

1. Open `mandarin-tutor/js/config.js`
2. Find the `azureSpeechConfig` section:

```javascript
export const azureSpeechConfig = {
    subscriptionKey: 'YOUR_AZURE_SPEECH_KEY',
    serviceRegion: 'YOUR_AZURE_REGION',
    language: 'zh-CN'
};
```

3. Replace `YOUR_AZURE_SPEECH_KEY` with your copied key
4. Replace `YOUR_AZURE_REGION` with your region (e.g., `westus`)
5. Save the file

Example:
```javascript
export const azureSpeechConfig = {
    subscriptionKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    serviceRegion: 'westus',
    language: 'zh-CN'
};
```

## Features

### Pronunciation Assessment Capabilities

The Azure Speech SDK provides the following assessment metrics:

1. **Accuracy Score**: How accurate the pronunciation is compared to native speakers
2. **Pronunciation Score**: Overall pronunciation quality
3. **Completeness Score**: Whether all expected words were spoken
4. **Fluency Score**: How naturally the speech flows

### Assessment Configuration

You can adjust the assessment settings in `config.js`:

```javascript
export const pronunciationAssessmentConfig = {
    referenceText: '', // Set dynamically per exercise
    gradingSystem: 'HundredMark', // Options: HundredMark, FivePoint
    granularity: 'Phoneme', // Options: Phoneme, Word, FullText
    enableMiscue: true, // Detect mispronunciations
    phonemeAlphabet: 'IPA' // International Phonetic Alphabet
};
```

## How It Works

1. **User records pronunciation**: When practicing, the user records their voice
2. **Audio sent to Azure**: The recorded audio is sent to Azure Speech Service
3. **Assessment performed**: Azure analyzes pronunciation against the reference text
4. **Results returned**: Detailed scores and feedback are displayed to the user

### Assessment Flow

```
User Records → Audio Blob Created → Sent to Azure Speech SDK
                                           ↓
User Sees Feedback ← Results Processed ← Assessment Result Returned
```

## Fallback Behavior

If Azure Speech SDK is not available or configured, the application will:
- Display a warning in the console
- Fall back to simulated scoring (random scores for demonstration)
- Continue to function normally with reduced accuracy

## Usage in Code

### Using Azure Assessment

```javascript
import { assessPronunciationWithAzure, isAzureSpeechAvailable } from './js/practice.js';

// Check if Azure is available
if (isAzureSpeechAvailable()) {
    console.log('Azure Speech SDK is ready');
}

// Assess pronunciation
const audioBlob = /* recorded audio blob */;
const referenceText = '你好'; // Chinese text to assess

const result = await assessPronunciationWithAzure(audioBlob, referenceText);
console.log(result);
// {
//   stars: 4,
//   toneScore: 85,
//   clarityScore: 88,
//   feedback: '👍 Great job! Very close to perfect!',
//   azureData: {
//     accuracyScore: 85,
//     pronunciationScore: 88,
//     completenessScore: 90,
//     fluencyScore: 82,
//     overallScore: 86,
//     recognizedText: '你好',
//     words: [...]
//   }
// }
```

## Security Considerations

### Production Deployment

**WARNING**: Storing API keys in client-side JavaScript is NOT secure for production!

For production applications, you should:

1. **Use a Backend API**: Store keys on a server
2. **Implement Token Authentication**: Use short-lived tokens
3. **Add Rate Limiting**: Prevent API abuse
4. **Monitor Usage**: Track API calls and costs

### Example Backend Implementation

```javascript
// backend/api/assess-pronunciation.js
const sdk = require("microsoft-cognitiveservices-speech-sdk");

app.post('/api/assess-pronunciation', async (req, res) => {
    const { audioData, referenceText } = req.body;
    
    // Keys stored securely in environment variables
    const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_REGION
    );
    
    // Perform assessment
    const result = await assessPronunciation(audioData, referenceText);
    
    res.json(result);
});
```

## Pricing

### Free Tier (F0)
- **5 hours** of audio per month
- **1 concurrent request**
- Perfect for development and testing

### Standard Tier (S0)
- **Pay as you go** ($1 per audio hour)
- **20 concurrent requests**
- Required for production

See [Azure Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/) for details.

## Troubleshooting

### "Azure Speech SDK not loaded"
- Check that the SDK script is included in `index.html`
- Ensure you have internet connection to load the CDN

### "Azure Speech credentials not configured"
- Verify you've replaced `YOUR_AZURE_SPEECH_KEY` and `YOUR_AZURE_REGION` in `config.js`
- Check that the key and region are correct

### "No speech could be recognized"
- Ensure the recorded audio is clear
- Check that the user's microphone is working
- Verify the reference text matches what was spoken

### "Recognition failed"
- Check console for detailed error messages
- Verify your Azure subscription is active
- Ensure you haven't exceeded quota limits

## Part 2: Azure Translator (Real-Time Translation)

### Step 1: Create Azure Translator Resource

1. Go to the [Azure Portal](https://portal.azure.com)
2. Click **Create a resource**
3. Search for **Translator** or **Cognitive Services**
4. Select **Translator** service
5. Click **Create**
6. Fill in the required information:
   - **Subscription**: Choose your subscription
   - **Resource Group**: Use the same as Speech Service or create new
   - **Region**: Choose a region (can be different from Speech Service)
   - **Name**: Give your resource a unique name
   - **Pricing Tier**: Choose **Free F0** (2M characters/month) or **Standard S1** (pay-as-you-go)
7. Click **Review + Create**, then **Create**

### Step 2: Get Your Translator Credentials

1. Once deployment is complete, go to your Translator resource
2. In the left menu, click **Keys and Endpoint**
3. Copy one of the keys (Key 1 or Key 2)
4. Note the **Location/Region** (e.g., `westus3`, `global`)

### Step 3: Configure the Translator in Application

1. Open `mandarin-tutor/js/config.js`
2. Find the `azureTranslatorConfig` section:

```javascript
export const azureTranslatorConfig = {
    subscriptionKey: 'YOUR_AZURE_TRANSLATOR_KEY',
    serviceRegion: 'westus3',
    endpoint: 'https://api.cognitive.microsofttranslator.com',
    fromLanguage: 'en',
    toLanguage: 'zh-Hans'
};
```

3. Replace `YOUR_AZURE_TRANSLATOR_KEY` with your copied key
4. Replace `serviceRegion` with your region if different
5. Save the file

Example:
```javascript
export const azureTranslatorConfig = {
    subscriptionKey: 'x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6',
    serviceRegion: 'westus3',
    endpoint: 'https://api.cognitive.microsofttranslator.com',
    fromLanguage: 'en',
    toLanguage: 'zh-Hans'
};
```

### How Azure Translator Works

1. **User enters English text**: In the translation tab
2. **Dictionary checked first**: Local dictionary is searched
3. **Azure fallback**: If not found, Azure Translator is called
4. **Results returned**: Chinese text and pinyin are displayed

### Translation Flow

```
User Input → Check Dictionary → Found? → Display Result
                    ↓ Not Found
            Azure Translator API → Translation + Pinyin → Display Result
```

### Usage in Code

```javascript
import { translateWord, isAzureTranslatorAvailable } from './js/translation.js';

// Check if Azure Translator is available
if (isAzureTranslatorAvailable()) {
    console.log('Azure Translator is ready');
}

// Translate a word (async)
const result = await translateWord('butterfly', true);
console.log(result);
// {
//   english: 'butterfly',
//   chinese: '蝴蝶',
//   pinyin: 'hú dié',
//   emoji: '🌐',
//   source: 'azure'
// }

// Dictionary only (sync)
import { translateWordSync } from './js/translation.js';
const dictResult = translateWordSync('hello');
// Only checks built-in dictionary
```

### Translation Features

- **Automatic fallback**: Dictionary first, then Azure if word not found
- **Pinyin generation**: Azure automatically generates pinyin romanization
- **Source indicator**: Results include `source: 'dictionary'` or `source: 'azure'`
- **Special emoji**: Azure translations show 🌐 emoji
- **Error handling**: Graceful fallback if Azure fails

### Translator Pricing

#### Free Tier (F0)
- **2 million characters** per month
- Perfect for most personal use cases
- No credit card required

#### Standard Tier (S1)
- **Pay as you go** ($10 per million characters)
- Required for high-volume applications
- No monthly character limit

See [Azure Translator Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/translator/) for details.

### Translator Troubleshooting

#### "Azure Translator not configured"
- Verify you've replaced `YOUR_AZURE_TRANSLATOR_KEY` in `config.js`
- Check that the key is correct and active

#### "Translation not found in dictionary, using Azure Translator..."
- This is normal behavior when a word isn't in the built-in dictionary
- Azure Translator is being used as intended

#### "Azure Translator API error: 401"
- Your subscription key is invalid or expired
- Double-check the key in `config.js`
- Verify your Azure subscription is active

#### "Azure Translator API error: 429"
- You've exceeded your quota (rate limiting)
- Wait a few moments and try again
- Consider upgrading to Standard tier if using heavily

## Combined Resources

### Azure Documentation
- [Azure Speech Service Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [Azure Translator Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/translator/)
- [Pronunciation Assessment Overview](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/how-to-pronunciation-assessment)
- [Translator API Reference](https://docs.microsoft.com/en-us/azure/cognitive-services/translator/reference/v3-0-translate)
- [Speech SDK JavaScript Quickstart](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/quickstarts/speech-to-text-from-microphone?pivots=programming-language-javascript)
- [Azure Free Account](https://azure.microsoft.com/en-us/free/)

### Cost Management

Both services offer free tiers suitable for development and moderate use:

| Service | Free Tier | Use Case |
|---------|-----------|----------|
| Azure Speech | 5 hours audio/month | Pronunciation practice (~300 assessments) |
| Azure Translator | 2M characters/month | Thousands of translations |

**Tip**: Monitor usage in Azure Portal → Cost Management to avoid unexpected charges.

## Next Steps

After setup:
1. Test the pronunciation assessment with sample phrases
2. Monitor your usage in the Azure Portal
3. Consider implementing backend authentication for production
4. Customize the assessment configuration based on your needs

## Support

For issues related to:
- **Azure Speech Service**: Contact Azure Support
- **Mandarin Tutor Application**: Open an issue in the project repository
