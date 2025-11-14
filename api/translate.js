// Vercel Serverless Function - Azure Translator Proxy
// This keeps your Azure API keys secure on the server side

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, fromLanguage = 'en', toLanguage = 'zh-Hans' } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: 'Missing required field: text' 
      });
    }

    // Get Azure credentials from environment variables
    const subscriptionKey = process.env.AZURE_TRANSLATOR_KEY;
    const serviceRegion = process.env.AZURE_TRANSLATOR_REGION || 'westus';
    const endpoint = 'https://api.cognitive.microsofttranslator.com';

    if (!subscriptionKey) {
      return res.status(500).json({ 
        error: 'Azure Translator credentials not configured on server' 
      });
    }

    // Call Azure Translator API
    const url = `${endpoint}/translate?api-version=3.0&from=${fromLanguage}&to=${toLanguage}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Ocp-Apim-Subscription-Region': serviceRegion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text }])
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Azure Translator error:', errorData);
      return res.status(response.status).json({
        success: false,
        error: 'Translation failed',
        details: errorData
      });
    }

    const data = await response.json();
    
    if (!data || data.length === 0 || !data[0].translations || data[0].translations.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Invalid response from Azure Translator'
      });
    }

    const translation = data[0].translations[0];
    
    // Generate pinyin using transliteration API
    let pinyin = '';
    try {
      const pinyinUrl = `${endpoint}/transliterate?api-version=3.0&language=zh-Hans&fromScript=Hans&toScript=Latn`;
      const pinyinResponse = await fetch(pinyinUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Ocp-Apim-Subscription-Region': serviceRegion,
          'Content-Type': 'application/json',
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
      console.error('Pinyin generation error:', pinyinError);
      // Continue without pinyin if it fails
    }

    return res.status(200).json({
      success: true,
      english: text,
      chinese: translation.text,
      pinyin: pinyin || translation.text, // Fallback to Chinese if pinyin fails
      emoji: '🌐', // Global emoji to indicate Azure translation
      source: 'azure'
    });

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
