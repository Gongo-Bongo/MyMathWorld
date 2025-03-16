# My Math World

A beautiful web viewer for mathematical content with PDF preview support.

## Local Development

To run this project locally and avoid CORS issues, you can use any of these methods:

### Using Python (Python 3)
```bash
# If you have Python 3 installed:
python -m http.server 8000
```

### Using Node.js
```bash
# If you have Node.js installed:
# First install serve globally
npm install -g serve
# Then run
serve
```

### Using PHP
```bash
# If you have PHP installed:
php -S localhost:8000
```

Then open your browser and navigate to:
```
http://localhost:8000
```

## Deployment to GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select your main branch as the source
4. Your site will be available at: `https://[username].github.io/[repository-name]`

## Features

- 🌓 Dark/Light mode
- 📄 PDF preview support
- 🖼️ Image previews
- 📱 Responsive design
- 🎯 File type detection
- ⚡ Fast loading
- 🔍 File filtering

## Note

When running locally, make sure to use a web server (instructions above) instead of opening the files directly. This ensures:
- PDF previews work correctly
- No CORS errors
- Proper asset loading