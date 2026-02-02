var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// Configuration
var CONFIG = {
    API_ENDPOINT: '/download' // Using relative path to work both locally and in deployment
};
// Function to download TikTok video
function downloadTikTokVideo(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch(CONFIG.API_ENDPOINT, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ url: url })
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (data.success && data.data) {
                        // Return the extracted data received from the server
                        return [2 /*return*/, data.data];
                    }
                    else {
                        throw new Error(data.error || 'Unknown error occurred');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error downloading TikTok video:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Function to create a clean display of the download options
function createDownloadCard(videoData) {
    return "\n      <div class=\"bg-white dark:bg-background-dark rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700\">\n        <div class=\"flex items-center mb-4\">\n          <img src=\"".concat(videoData.authorImage, "\" alt=\"Author\" class=\"w-16 h-16 rounded-full mr-4 border-2 border-primary\">\n          <div>\n            <h3 class=\"text-xl font-bold\">").concat(videoData.authorName, "</h3>\n            <div class=\"flex space-x-4 text-sm text-gray-500 dark:text-gray-400\">\n              <span>\u2764\uFE0F ").concat(videoData.likesCount, "</span>\n              <span>\uD83D\uDCAC ").concat(videoData.commentsCount, "</span>\n              <span>\uD83D\uDCE4 ").concat(videoData.sharesCount, "</span>\n            </div>\n          </div>\n        </div>\n\n        ").concat(videoData.maintext ? "\n        <div class=\"mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg\">\n          <p class=\"text-gray-700 dark:text-gray-300\">".concat(videoData.maintext, "</p>\n        </div>\n        ") : '', "\n\n        <div class=\"grid grid-cols-1 md:grid-cols-2 gap-4 mt-6\">\n          ").concat(videoData.withoutWatermarkLink ? "\n          <a href=\"".concat(videoData.withoutWatermarkLink, "\" target=\"_blank\"\n             class=\"flex items-center justify-center bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors\">\n            <span class=\"material-symbols-outlined mr-2\">download</span>\n            Download Without Watermark\n          </a>\n          ") : '', "\n\n          ").concat(videoData.mp3DownloadLink ? "\n          <a href=\"".concat(videoData.mp3DownloadLink, "\" target=\"_blank\"\n             class=\"flex items-center justify-center bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors\">\n            <span class=\"material-symbols-outlined mr-2\">music_note</span>\n            Download Audio (MP3)\n          </a>\n          ") : '', "\n        </div>\n\n        <div class=\"mt-6 pt-4 border-t border-gray-200 dark:border-gray-700\">\n          <h4 class=\"font-bold mb-2\">Instructions:</h4>\n          <ol class=\"list-decimal pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300\">\n            <li>Click on the \"Download Without Watermark\" button to get the video</li>\n            <li>Right-click the video and select \"Save video as...\" to download</li>\n            <li>For audio, click the \"Download Audio (MP3)\" button</li>\n          </ol>\n        </div>\n\n        <div class=\"mt-6 text-center\">\n          <button\n            class=\"flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold h-12 px-6 transition-all shadow-xl mx-auto\"\n            onclick=\"resetForm()\">\n            <span class=\"material-symbols-outlined\">refresh</span> New Download\n          </button>\n        </div>\n      </div>\n    ");
}
// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
    var downloadBtn = document.getElementById('download-btn');
    var urlInput = document.getElementById('tiktok-url-input');
    var inputSection = document.getElementById('input-section');
    var resultsPlaceholder = document.getElementById('results-placeholder');
    if (!downloadBtn || !urlInput || !inputSection || !resultsPlaceholder) {
        console.error('Required elements not found in the DOM');
        return;
    }
    downloadBtn.addEventListener('click', function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, videoData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = urlInput.value.trim();
                        if (!url) {
                            alert('Please enter a TikTok URL');
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        // Show loading state
                        downloadBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Downloading...';
                        downloadBtn.disabled = true;
                        return [4 /*yield*/, downloadTikTokVideo(url)];
                    case 2:
                        videoData = _a.sent();
                        // Hide the input section and show results in its place
                        inputSection.style.display = 'none';
                        resultsPlaceholder.style.display = 'block';
                        resultsPlaceholder.innerHTML = createDownloadCard(videoData);
                        // Scroll to results
                        resultsPlaceholder.scrollIntoView({ behavior: 'smooth' });
                        return [3 /*break*/, 5];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Download failed:', error_2);
                        alert('Failed to download the video. Please try again.');
                        return [3 /*break*/, 5];
                    case 4:
                        // Reset button state
                        downloadBtn.innerHTML = '<span class="material-symbols-outlined">download</span> Download';
                        downloadBtn.disabled = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    });
    // Also allow Enter key to trigger download
    urlInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            downloadBtn.click();
        }
    });
    // Function to reset the form
    window.resetForm = function () {
        // Show the input section again and hide results
        inputSection.style.display = 'block';
        resultsPlaceholder.style.display = 'none';
        resultsPlaceholder.innerHTML = ''; // Clear the results
        urlInput.value = '';
        urlInput.focus();
    };
});
// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', function () {
    var darkModeToggle = document.getElementById('dark-mode-toggle');
    var darkModeIcon = document.getElementById('dark-mode-icon');
    if (!darkModeToggle || !darkModeIcon) {
        console.error('Dark mode elements not found in the DOM');
        return;
    }
    // Check for saved theme preference or respect OS setting
    var prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    // Function to update the icon based on current theme
    function updateDarkModeIcon() {
        if (document.documentElement.classList.contains('dark')) {
            darkModeIcon.textContent = 'light_mode';
        }
        else {
            darkModeIcon.textContent = 'dark_mode';
        }
    }
    // Function to toggle dark mode
    function toggleDarkMode() {
        document.documentElement.classList.toggle('dark');
        // Save the user's preference in localStorage
        var isDarkMode = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        // Update the icon
        updateDarkModeIcon();
    }
    // Check for saved theme or OS preference
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.documentElement.classList.add('dark');
    }
    // Initialize the icon
    updateDarkModeIcon();
    // Add click event to the toggle button
    darkModeToggle.addEventListener('click', toggleDarkMode);
    // Listen for OS theme changes
    prefersDarkScheme.addEventListener('change', function (e) {
        if (!localStorage.getItem('theme')) {
            document.documentElement.classList.toggle('dark', e.matches);
            updateDarkModeIcon();
        }
    });
});
