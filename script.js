// Configuration
const CONFIG = {
    API_ENDPOINT: typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? '/api/download'  // Use API route for Vercel deployment
        : '/download'      // Use direct route for local development
};

async function downloadTikTokVideo(url) {
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Return the extracted data received from the server
            return data.data;
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Error downloading TikTok video:', error);
        throw error;
    }
}

// Function to create a clean display of the download options
function createDownloadCard(videoData) {
    return `
      <div class="bg-white dark:bg-background-dark rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center mb-4">
          <img src="${videoData.authorImage}" alt="Author" class="w-16 h-16 rounded-full mr-4 border-2 border-primary">
          <div>
            <h3 class="text-xl font-bold">${videoData.authorName}</h3>
            <div class="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>❤️ ${videoData.likesCount}</span>
              <span>💬 ${videoData.commentsCount}</span>
              <span>📤 ${videoData.sharesCount}</span>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          ${videoData.withoutWatermarkLink ? `
          <a href="${videoData.withoutWatermarkLink}" target="_blank" 
             class="flex items-center justify-center bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
            <span class="material-symbols-outlined mr-2">download</span>
            Download Without Watermark
          </a>
          ` : ''}
          
          ${videoData.mp3DownloadLink ? `
          <a href="${videoData.mp3DownloadLink}" target="_blank"
             class="flex items-center justify-center bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
            <span class="material-symbols-outlined mr-2">music_note</span>
            Download Audio (MP3)
          </a>
          ` : ''}
        </div>
        
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 class="font-bold mb-2">Instructions:</h4>
          <ol class="list-decimal pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li>Click on the "Download Without Watermark" button to get the video</li>
            <li>Right-click the video and select "Save video as..." to download</li>
            <li>For audio, click the "Download Audio (MP3)" button</li>
          </ol>
        </div>
        
        <div class="mt-6 text-center">
          <button
            class="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold h-12 px-6 transition-all shadow-xl mx-auto"
            onclick="resetForm()">
            <span class="material-symbols-outlined">refresh</span> New Download
          </button>
        </div>
      </div>
    `;
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('download-btn');
    const urlInput = document.getElementById('tiktok-url-input');
    const inputSection = document.getElementById('input-section');
    const resultsPlaceholder = document.getElementById('results-placeholder');

    downloadBtn.addEventListener('click', async function() {
        const url = urlInput.value.trim();

        if (!url) {
            alert('Please enter a TikTok URL');
            return;
        }

        try {
            // Show loading state
            downloadBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Downloading...';
            downloadBtn.disabled = true;

            // Call the download function
            const videoData = await downloadTikTokVideo(url);

            // Hide the input section and show results in its place
            inputSection.style.display = 'none';
            resultsPlaceholder.style.display = 'block';
            resultsPlaceholder.innerHTML = createDownloadCard(videoData);

            // Scroll to results
            resultsPlaceholder.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download the video. Please try again.');
        } finally {
            // Reset button state
            downloadBtn.innerHTML = '<span class="material-symbols-outlined">download</span> Download';
            downloadBtn.disabled = false;
        }
    });

    // Also allow Enter key to trigger download
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            downloadBtn.click();
        }
    });

    // Function to reset the form
    window.resetForm = function() {
        // Show the input section again and hide results
        inputSection.style.display = 'block';
        resultsPlaceholder.style.display = 'none';
        resultsPlaceholder.innerHTML = ''; // Clear the results
        urlInput.value = '';
        urlInput.focus();
    };
});

// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcon = document.getElementById('dark-mode-icon');

    // Check for saved theme preference or respect OS setting
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Function to update the icon based on current theme
    function updateDarkModeIcon() {
        if (document.documentElement.classList.contains('dark')) {
            darkModeIcon.textContent = 'light_mode';
        } else {
            darkModeIcon.textContent = 'dark_mode';
        }
    }

    // Function to toggle dark mode
    function toggleDarkMode() {
        document.documentElement.classList.toggle('dark');

        // Save the user's preference in localStorage
        const isDarkMode = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

        // Update the icon
        updateDarkModeIcon();
    }

    // Check for saved theme or OS preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.documentElement.classList.add('dark');
    }

    // Initialize the icon
    updateDarkModeIcon();

    // Add click event to the toggle button
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Listen for OS theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.classList.toggle('dark', e.matches);
            updateDarkModeIcon();
        }
    });
});