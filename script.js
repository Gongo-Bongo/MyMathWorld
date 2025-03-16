// Theme toggling functionality with persistence
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
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
    localStorage.setItem('theme', newTheme);
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
    const repo = "Gongo-Bongo/MyMathWorld"
    if (!repo) {
        alert('Please enter a GitHub repository (user/repo)');
        return;
    }

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    document.getElementById('repoContents').innerHTML = '<p class="loading">Loading...</p>';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Repository not found');
        const data = await response.json();

        let contentHtml = '<div class="content-grid">';
        
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
        const filteredData = data.filter(item => 
            !["index.html", "README.md", "LICENSE", "CNAME", "favicon_io", "styles.css", "script.js"]
            .includes(item.name)
        );

        for (const item of filteredData) {
            const fileUrl = item.type === 'dir' 
                ? '#' 
                : `https://gongo-bongo.github.io/MyMathWorld/${item.path}`;
            
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
                    const fileUrl = `https://gongo-bongo.github.io/MyMathWorld/${item.path}`;
                    renderPDFPreview(fileUrl, container);
                }
            }
        }
    } catch (error) {
        console.error(error);
        document.getElementById('repoContents').innerHTML = 
            '<p style="color:var(--text-secondary);text-align:center;padding:20px;">Error loading repository.</p>';
    }
}

// Initialize theme and repository contents
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadRepo();
}); 