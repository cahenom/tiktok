const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

// For Vercel compatibility
const isVercel = !!process.env.VERCEL;

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Define allowed origins (including Vercel deployment URL)
const BASE_ALLOWED_ORIGINS = [
    'http://localhost:' + PORT,
    'http://127.0.0.1:' + PORT,
    'http://localhost:3000', // Default port
    'http://127.0.0.1:3000',
    'http://localhost:' + PORT.toString(),
    'http://127.0.0.1:' + PORT.toString()
];

// Add Vercel deployment URL if available
if (process.env.VERCEL_URL) {
    BASE_ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
}

const ALLOWED_ORIGINS = BASE_ALLOWED_ORIGINS;

// Custom middleware to check origin
const checkOrigin = (req, res, next) => {
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    const host = req.get('Host');

    // If no origin header, check if request is coming from same host
    if (!origin) {
        // Allow requests without origin header (like direct browser requests)
        next();
        return;
    }

    // Construct the expected origin based on the request
    const expectedOrigin = `http://${host}`;
    const expectedOriginSSL = `https://${host}`;

    // Check if the origin is in the allowed list
    if (
        ALLOWED_ORIGINS.includes(origin) ||
        origin === expectedOrigin ||
        origin === expectedOriginSSL ||
        (referer && (referer.startsWith(`http://${host}`) || referer.startsWith(`https://${host}`)))
    ) {
        next();
    } else {
        // Unauthorized origin - return error
        console.log(`Blocked request from origin: ${origin}`);
        return res.status(403).json({
            error: 'Unauthorized request origin'
        });
    }
};

// Apply security middleware
app.use(checkOrigin);

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files from the root directory

// Route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to download TikTok video
app.post('/download', async (req, res) => {
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

        // Log the response for debugging (first 1000 chars)
        console.log('Response preview:', response.data.substring(0, 1000));

        // Parse the HTML response
        const $ = cheerio.load(response.data);

        // Extract relevant information
        const authorImage = $('.result_author').attr('src') || '';
        const authorName = $('h2').first().text().trim() || 'Unknown Author';
        const withoutWatermarkLink = $('.download_link.without_watermark').attr('href') || '';

        // Multiple selectors for the music link to ensure we capture it
        // The original HTML shows class="... download_link music ..." so we need to find elements
        // that have both "download_link" and "music" in their class attribute
        let mp3DownloadLink = $('[class*="download_link"][class*="music"]').attr('href') || '';

        // If the combined class selector didn't work, try finding by text content
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
                console.log('Found music link by text "Download MP3":', mp3DownloadLink);
            }
        }

        // Log for debugging
        console.log('Selectors tried for music link:');
        console.log('- [class*="download_link"][class*="music"]:', $('[class*="download_link"][class*="music"]').attr('href') || 'NOT FOUND');
        console.log('- Text search "Download MP3":', $('#dl_btns a').filter((i, el) =>
            $(el).text().trim() === 'Download MP3').attr('href') || 'NOT FOUND');
        console.log('Final MP3 link:', mp3DownloadLink || 'NOT FOUND');

        const likesCount = $('.feather.feather-thumbs-up').parent().next().text().trim() || '0';
        const commentsCount = $('.feather.feather-message-square').parent().next().text().trim() || '0';
        const sharesCount = $('.feather.feather-share-2').parent().next().text().trim() || '0';

        // Log for debugging
        console.log('Extracted data:', {
            authorImage,
            authorName,
            withoutWatermarkLink,
            mp3DownloadLink: mp3DownloadLink || 'NOT FOUND',
            likesCount,
            commentsCount,
            sharesCount
        });

        // Return extracted data
        res.json({
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
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});