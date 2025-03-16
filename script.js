// Configuration object
const config = {
    repository: {
        owner: "Gongo-Bongo",
        name: "MyMathWorld",
        branch: "main",
        excludedFiles: [
            "index.html",
            "README.md",
            "LICENSE",
            "CNAME",
            "favicon_io",
            "styles.css",
            "script.js"
        ]
    },
    theme: {
        default: 'light',
        storageKey: 'theme'
    }
};

// Repository settings form
function showRepoSettings() {
    const currentContent = document.getElementById('repoContents').innerHTML;
    document.getElementById('repoContents').innerHTML = `
        <div class="settings-container">
            <h3>Repository Settings</h3>
            <form id="repoSettingsForm" class="settings-form">
                <div class="form-group">
                    <label for="repoOwner">Repository Owner:</label>
                    <input type="text" id="repoOwner" value="${config.repository.owner}" placeholder="e.g., username" required>
                </div>
                <div class="form-group">
                    <label for="repoName">Repository Name:</label>
                    <input type="text" id="repoName" value="${config.repository.name}" placeholder="e.g., my-repo" required>
                </div>
                <div class="form-group">
                    <label for="repoBranch">Branch:</label>
                    <input type="text" id="repoBranch" value="${config.repository.branch}" placeholder="e.g., main">
                </div>
                <div class="form-actions">
                    <button type="submit" class="settings-button">Save & Load</button>
                    <button type="button" class="settings-button cancel" onclick="loadRepo()">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('repoSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateRepoSettings();
    });
}

function updateRepoSettings() {
    const owner = document.getElementById('repoOwner').value.trim();
    const name = document.getElementById('repoName').value.trim();
    const branch = document.getElementById('repoBranch').value.trim();

    if (owner && name) {
        config.repository.owner = owner;
        config.repository.name = name;
        config.repository.branch = branch || 'main';
        
        // Save settings to localStorage
        localStorage.setItem('repoConfig', JSON.stringify(config.repository));
        
        // Reload repository contents
        loadRepo();
    }
}

// Theme functions
function initializeTheme() {
    const savedTheme = localStorage.getItem(config.theme.storageKey) || config.theme.default;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    
    if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem(config.theme.storageKey, newTheme);
    updateThemeButton(newTheme);
}

// Function to get file extension
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Function to get appropriate icon for file type
function getFileIcon(filename) {
    const ext = getFileExtension(filename);
    const icons = {
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        txt: '📝',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️',
        mp4: '🎥',
        mov: '🎥',
        zip: '📦',
        default: '📄'
    };
    return icons[ext] || icons.default;
}

// Function to check if file is an image
function isImage(filename) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return imageExtensions.includes(getFileExtension(filename));
}

// PDF handling functions
async function renderPDFPreview(url, container) {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        // Calculate scale to fit the container width (250px card width - 40px padding)
        const containerWidth = 210;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.classList.add('pdf-preview-canvas');
        
        await page.render({
            canvasContext: context,
            viewport: scaledViewport
        }).promise;
        
        container.innerHTML = '';
        container.appendChild(canvas);
    } catch (error) {
        console.error('Error generating PDF preview:', error);
        container.innerHTML = `
            <div class="preview-placeholder">
                📄
                <div class="preview-error">Preview not available</div>
            </div>
        `;
    }
}

async function loadRepo(path = '') {
    const { owner, name, excludedFiles } = config.repository;
    const baseUrl = `https://${owner}.github.io/${name}`;
    const apiUrl = `https://api.github.com/repos/${owner}/${name}/contents/${path}`;

    document.getElementById('repoContents').innerHTML = '<p class="loading">Loading repository contents...</p>';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Repository not found');
        const data = await response.json();

        let contentHtml = `
            <div class="repo-header">
                <h3>${owner}/${name}</h3>
                <button onclick="showRepoSettings()" class="settings-button">
                    ⚙️ Change Repository
                </button>
            </div>
            <div class="content-grid">
        `;
        
        if (path) {
            const parentPath = path.split('/').slice(0, -1).join('/');
            contentHtml = `
                <div class="breadcrumb">
                    <a href="#" class="back-button" onclick="loadRepo('${parentPath}')">
                        ⬅️ Back
                    </a>
                    <span>/${path}</span>
                </div>
                ${contentHtml}
            `;
        }

        // Filter and sort the items
        const filteredData = data.filter(item => !excludedFiles.includes(item.name));

        for (const item of filteredData) {
            const fileUrl = item.type === 'dir' ? '#' : `${baseUrl}/${item.path}`;
            
            const isPDF = item.name.toLowerCase().endsWith('.pdf');
            const onClick = item.type === 'dir' 
                ? `onclick="loadRepo('${item.path}')"` 
                : (isPDF ? '' : `onclick="window.open('${fileUrl}', '_blank')"`);

            let previewHtml = '';
            if (item.type === 'file') {
                if (isImage(item.name)) {
                    previewHtml = `
                        <div class="card-preview">
                            <img src="${fileUrl}" alt="${item.name}" loading="lazy">
                        </div>
                    `;
                } else if (isPDF) {
                    previewHtml = `
                        <div class="card-preview">
                            <div class="pdf-preview-container" id="pdf-${item.name.replace(/[^a-zA-Z0-9]/g, '-')}">
                                <div class="preview-placeholder">
                                    <div class="loading-spinner"></div>
                                    Loading preview...
                                </div>
                            </div>
                            <div class="pdf-preview-actions">
                                <button class="pdf-action-button" onclick="window.open('${fileUrl}', '_blank')">
                                    ↗️ Open PDF
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    previewHtml = `
                        <div class="preview-placeholder">
                            ${getFileIcon(item.name)}
                        </div>
                    `;
                }
            }

            contentHtml += `
                <div class="card" ${onClick}>
                    <div class="card-title">
                        <span class="card-icon">${item.type === 'dir' ? '📁' : getFileIcon(item.name)}</span>
                        <span>${item.name}</span>
                    </div>
                    ${previewHtml}
                    <span class="file-badge">${item.type === 'dir' ? 'Folder' : getFileExtension(item.name).toUpperCase()}</span>
                </div>
            `;
        }
        contentHtml += '</div>';

        document.getElementById('repoContents').innerHTML = contentHtml;

        // Render PDF previews after the content is added to DOM
        for (const item of filteredData) {
            if (item.type === 'file' && item.name.toLowerCase().endsWith('.pdf')) {
                const containerId = `pdf-${item.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
                const container = document.getElementById(containerId);
                if (container) {
                    const fileUrl = `${baseUrl}/${item.path}`;
                    renderPDFPreview(fileUrl, container);
                }
            }
        }
    } catch (error) {
        console.error(error);
        document.getElementById('repoContents').innerHTML = `
            <div class="error-container">
                <p>Error loading repository. Please check if:</p>
                <ul>
                    <li>The repository exists and is public</li>
                    <li>GitHub Pages is enabled for this repository</li>
                    <li>The repository owner and name are correct</li>
                </ul>
                <button onclick="showRepoSettings()" class="settings-button">
                    ⚙️ Check Repository Settings
                </button>
            </div>
        `;
    }
}

// Initialize application
function initializeApp() {
    // Load saved repository settings if they exist
    const savedConfig = localStorage.getItem('repoConfig');
    if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        Object.assign(config.repository, parsedConfig);
    }

    initializeTheme();
    loadRepo();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp); 