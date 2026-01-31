// Vercel API route for TikTok download functionality
const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Prepare form data for the ssstik.io API
    const formData = new URLSearchParams();
    formData.append('id', url);
    formData.append('locale', 'id');
    formData.append('tt', 'cG9WcXBl');

    // Make request to ssstik.io
    const response = await axios.post('https://ssstik.io/abc?url=dl', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://ssstik.io',
        'Referer': 'https://ssstik.io/',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Connection': 'keep-alive'
      },
      timeout: 15000 // 15 second timeout
    });

    // Parse the HTML response
    const $ = cheerio.load(response.data);

    // Extract relevant information
    const authorImage = $('.result_author').attr('src') || '';
    const authorName = $('h2').first().text().trim() || 'Unknown Author';
    
    // Multiple selectors for the music link to ensure we capture it
    let mp3DownloadLink = $('[class*="download_link"][class*="music"]').attr('href') || '';
    
    if (!mp3DownloadLink) {
      $('#dl_btns a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().toLowerCase();
        const classes = $(elem).attr('class') || '';
        
        // Look for links with "download" and "mp3"/"music"/"audio" in text, and "download_link" in class
        if ((text.includes('download') && (text.includes('mp3') || text.includes('music') || text.includes('audio')))
            && classes.includes('download_link')) {
          mp3DownloadLink = href;
          return false; // break the loop
        }
      });
    }

    // If still not found, try finding by the specific text "Download MP3"
    if (!mp3DownloadLink) {
      const mp3Link = $('#dl_btns a').filter((i, el) => {
        return $(el).text().trim() === 'Download MP3';
      }).first();
      
      if (mp3Link.length > 0) {
        mp3DownloadLink = mp3Link.attr('href');
      }
    }

    const withoutWatermarkLink = $('.download_link.without_watermark').attr('href') || '';
    const likesCount = $('.feather.feather-thumbs-up').parent().next().text().trim() || '0';
    const commentsCount = $('.feather.feather-message-square').parent().next().text().trim() || '0';
    const sharesCount = $('.feather.feather-share-2').parent().next().text().trim() || '0';

    // Return extracted data
    res.status(200).json({
      success: true,
      data: {
        authorImage,
        authorName,
        withoutWatermarkLink,
        mp3DownloadLink,
        likesCount,
        commentsCount,
        sharesCount
      }
    });

  } catch (error) {
    console.error('Error downloading TikTok video:', error.message);
    
    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
    
    // Check if it's a network error
    if (error.response) {
      // Server responded with error status
      res.status(error.response.status).json({ 
        error: `Service temporarily unavailable (${error.response.status})` 
      });
    } else if (error.request) {
      // Request was made but no response received
      res.status(503).json({ error: 'Unable to reach the download service' });
    } else {
      // Something else happened
      res.status(500).json({ error: 'Failed to download the video' });
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};