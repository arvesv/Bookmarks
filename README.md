# Bookmarks

This repo is a static website containing my most useful links. The links are read from a JSON file.

This repo is published directly using GitHub Pages.

---

## 🌟 Features

- **Dynamic Content**: All links and categories are defined in [`bookmarks.json`](bookmarks.json).
- **Search & Filter**: Real-time search across titles, descriptions, URLs, tags, and categories.
- **Tag Filtering**: Click any `#tag` to immediately isolate matching resources.
- **Automatic System Theme**: Seamlessly adapts to system dark or light mode preferences.
- **Copy Link**: One-click URL copying with visual feedback.
- **Responsive Design**: Clean layout that adapts seamlessly to desktop, tablet, and mobile screens.
- **Keyboard Shortcuts**:
  - `/` or `Ctrl + K`: Jump to search bar
  - `Escape`: Clear search

## 📂 Project Structure

```text
Bookmarks/
├── bookmarks.json   # JSON file containing all bookmarks, categories, and tags
├── index.html       # Static HTML entry point
├── style.css        # Stylesheet with automatic system theme support
├── app.js           # Client-side script to fetch JSON and render UI
├── README.md        # Project documentation
└── LICENSE          # Project license
```

## ✏️ How to Add or Edit Bookmarks

Open [`bookmarks.json`](bookmarks.json) and add an entry under the desired category:

```json
{
  "title": "Example Site",
  "url": "https://example.com",
  "description": "Short explanation of why this link is useful.",
  "tags": ["tools", "reference"],
  "clicks": 0
}
```

You can also add new categories to the `categories` array:

```json
{
  "id": "new-category",
  "name": "New Category Name",
  "icon": "🚀",
  "bookmarks": []
}
```

## 🚀 How to Run Locally

Because `fetch()` is used to load `bookmarks.json`, running via a simple HTTP server avoids browser local file (`file://`) restrictions:

- **Using Python 3**:
  ```bash
  python -m http.server 8000
  ```
- **Using Node.js**:
  ```bash
  npx serve .
  ```
- **Using VS Code**:
  Install the **Live Server** extension and click **Go Live**.

## 🌐 Publishing on GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings** > **Pages** in your repository.
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or `master`), folder: `/ (root)`
4. Click **Save**. Your site will be live at `https://<username>.github.io/<repo-name>/`.

## 📦 Creating a Release

This repository includes an automated release workflow via GitHub Actions:

1. Navigate to the **Actions** tab in GitHub.
2. Select the **Release** workflow in the left sidebar.
3. Click **Run workflow**.
4. Enter the desired version number (e.g. `v1.0.0` or `1.0.0`).
5. Click **Run workflow**:
   - The workflow updates `version.json` on `master` and creates an annotated tag.
   - Merges the tagged release into the `latest` branch.
   - Publishes a GitHub Release with auto-generated release notes.
