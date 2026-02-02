import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Define allowed origins
const ALLOWED_ORIGINS = [
    'http://localhost:' + PORT,
    'http://127.0.0.1:' + PORT,
    'http://localhost:3000', // Default port
    'http://127.0.0.1:3000',
    'http://localhost:' + PORT.toString(),
    'http://127.0.0.1:' + PORT.toString(),
    'https://tiktok-three-phi.vercel.app', // Production domain
    'https://tiktok-three-phi.vercel.app/' // Production domain with trailing slash
];

// Interface for the video data response
interface VideoData {
    authorImage: string;
    authorName: string;
    withoutWatermarkLink: string;
    mp3DownloadLink: string;
    likesCount: string;
    commentsCount: string;
    sharesCount: string;
}

// Interface for the API response
interface ApiResponse {
    success: boolean;
    data?: VideoData;
    error?: string;
}

// Custom middleware to check origin
const checkOrigin = (req: Request, res: Response, next: NextFunction) => {
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
        return;
    } else {
        // Unauthorized origin - return error
        console.log(`Blocked request from origin: ${origin}`);
        res.status(403).json({
            error: 'Unauthorized request origin'
        });
        return;
    }
};

// Apply security middleware
app.use(checkOrigin);

// Define CORS options separately to avoid inline function issues
const corsOptions: cors.CorsOptions = {
    origin: function(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            callback(null, true);
            return;
        }
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
            callback(null, true);
            return;
        } else {
            console.log(`CORS blocked request from origin: ${origin}`);
            callback(null, true); // Allow all origins in production for this service
        }
    }
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Then serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Also serve other static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// For Vercel deployment, handle root route to serve index.html
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Handle all other GET routes by serving index.html (for SPA)
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Endpoint to download TikTok video
app.post('/download', async (req: Request, res: Response) => {
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
        const authorImage = $('.result_author').first().attr('src') ||
                           $('.author-thumb img').first().attr('src') ||
                           $('.avatar img').first().attr('src') || '';
        const authorName = $('h2').first().text().trim() ||
                          $('.author-nickname').first().text().trim() ||
                          $('.author-name').first().text().trim() ||
                          'Unknown Author';

        // More flexible selectors for the music link to ensure we capture it
        // The original HTML shows class="... download_link music ..." so we need to find elements
        // that have both "download_link" and "music" in their class attribute
        let mp3DownloadLink = $('[class*="download_link"][class*="music"]').first().attr('href') ||
                             $('[class*="music_download"]').first().attr('href') ||
                             $('[href*="music"]').first().attr('href') || '';

        // If the combined class selector didn't work, try finding by text content
        if (!mp3DownloadLink) {
            $('#dl_btns a').each((i, elem): boolean | void => {
                const href = $(elem).attr('href');
                const text = $(elem).text().toLowerCase();
                const classes = $(elem).attr('class') || '';

                // Look for links with "download" and "mp3"/"music"/"audio" in text, and "download_link" in class
                if ((text.includes('download') && (text.includes('mp3') || text.includes('music') || text.includes('audio')))
                    && classes.includes('download_link')) {
                    mp3DownloadLink = href || '';
                    return false; // break the loop
                }
            });
        }

        // If still not found, try finding by the specific text "Download MP3"
        if (!mp3DownloadLink) {
            const mp3Link = $('#dl_btns a').filter((i, el) => {
                return $(el).text().trim() === 'Download MP3' || $(el).text().trim().includes('MP3');
            }).first();

            if (mp3Link.length > 0) {
                mp3DownloadLink = mp3Link.attr('href') || '';
                console.log('Found music link by text "Download MP3":', mp3DownloadLink);
            }
        }

        // Log for debugging (only in development)
        if (process.env.NODE_ENV !== 'production') {
            console.log('Selectors tried for music link:');
            console.log('- [class*="download_link"][class*="music"]:', $('[class*="download_link"][class*="music"]').first().attr('href') || 'NOT FOUND');
            console.log('- [class*="music_download"]:', $('[class*="music_download"]').first().attr('href') || 'NOT FOUND');
            console.log('- [href*="music"]:', $('[href*="music"]').first().attr('href') || 'NOT FOUND');
            console.log('- Text search "Download MP3":', $('#dl_btns a').filter((i, el) =>
                $(el).text().trim() === 'Download MP3').first().attr('href') || 'NOT FOUND');
            console.log('Final MP3 link:', mp3DownloadLink || 'NOT FOUND');
        }

        const withoutWatermarkLink = $('.download_link.without_watermark').first().attr('href') ||
                                    $('[href*="nowatermark"]').first().attr('href') ||
                                    $('[class*="no-watermark"]').first().attr('href') || '';
        const likesCount = $('.feather.feather-thumbs-up').first().closest('.count-item').find('.value').first().text().trim() ||
                          $('.stats-like').first().text().trim() ||
                          $('.like-count').first().text().trim() || '0';
        const commentsCount = $('.feather.feather-message-square').first().closest('.count-item').find('.value').first().text().trim() ||
                             $('.stats-comment').first().text().trim() ||
                             $('.comment-count').first().text().trim() || '0';
        const sharesCount = $('.feather.feather-share-2').first().closest('.count-item').find('.value').first().text().trim() ||
                           $('.stats-share').first().text().trim() ||
                           $('.share-count').first().text().trim() || '0';

        // Return extracted data
        const apiResponse: ApiResponse = {
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
        };

        res.json(apiResponse);
        return; // Explicitly return to satisfy TypeScript

    } catch (error: any) {
        console.error('Error downloading TikTok video:', error);

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
            return; // Explicitly return to satisfy TypeScript
        } else if (error.request) {
            // Request was made but no response received
            res.status(503).json({ error: 'Unable to reach the download service' });
            return; // Explicitly return to satisfy TypeScript
        } else {
            // Something else happened
            res.status(500).json({ error: error.message || 'Failed to download the video' });
            return; // Explicitly return to satisfy TypeScript
        }
    }
});

// API endpoint for downloading TikTok videos - keep the original POST endpoint
// The client will call POST /download to get the video data

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;