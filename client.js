"use strict";
const CONFIG = {
    API_ENDPOINT: '/download'
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
        if (data.success && data.data) {
            return data.data;
        }
        else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    }
    catch (error) {
        console.error('Error downloading TikTok video:', error);
        throw error;
    }
}
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
document.addEventListener('DOMContentLoaded', function () {
    const downloadBtn = document.getElementById('download-btn');
    const urlInput = document.getElementById('tiktok-url-input');
    const inputSection = document.getElementById('input-section');
    const resultsPlaceholder = document.getElementById('results-placeholder');
    if (!downloadBtn || !urlInput || !inputSection || !resultsPlaceholder) {
        console.error('Required elements not found in the DOM');
        return;
    }
    downloadBtn.addEventListener('click', async function () {
        const url = urlInput.value.trim();
        if (!url) {
            alert('Please enter a TikTok URL');
            return;
        }
        try {
            downloadBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Downloading...';
            downloadBtn.disabled = true;
            const videoData = await downloadTikTokVideo(url);
            inputSection.style.display = 'none';
            resultsPlaceholder.style.display = 'block';
            resultsPlaceholder.innerHTML = createDownloadCard(videoData);
            resultsPlaceholder.scrollIntoView({ behavior: 'smooth' });
        }
        catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download the video. Please try again.');
        }
        finally {
            downloadBtn.innerHTML = '<span class="material-symbols-outlined">download</span> Download';
            downloadBtn.disabled = false;
        }
    });
    urlInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            downloadBtn.click();
        }
    });
    window.resetForm = function () {
        inputSection.style.display = 'block';
        resultsPlaceholder.style.display = 'none';
        resultsPlaceholder.innerHTML = '';
        urlInput.value = '';
        urlInput.focus();
    };
});
document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcon = document.getElementById('dark-mode-icon');
    if (!darkModeToggle || !darkModeIcon) {
        console.error('Dark mode elements not found in the DOM');
        return;
    }
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    function updateDarkModeIcon() {
        if (document.documentElement.classList.contains('dark')) {
            darkModeIcon.textContent = 'light_mode';
        }
        else {
            darkModeIcon.textContent = 'dark_mode';
        }
    }
    function toggleDarkMode() {
        document.documentElement.classList.toggle('dark');
        const isDarkMode = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        updateDarkModeIcon();
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.documentElement.classList.add('dark');
    }
    updateDarkModeIcon();
    darkModeToggle.addEventListener('click', toggleDarkMode);
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.classList.toggle('dark', e.matches);
            updateDarkModeIcon();
        }
    });
});
