# StarCanvas by Wanjuan

<div align="center">

![StarCanvas](../docs/screenshots/01-canvas.png)

**Desktop Canvas Application for AI Creation Workflow**

[![Version](https://img.shields.io/badge/version-1.4.5-blue.svg)](https://github.com/Guan-XX003/StarCanvas/releases)
[![Platform](https://img.shields.io/badge/platform-macOS%20|%20Windows-lightgrey.svg)](#installation)
[![License](https://img.shields.io/badge/license-PolyForm%20Noncommercial-orange.svg)](../LICENSE)

[Download Latest](../../releases/latest) · [Features](#key-features) · [Quick Start](#development) · [Changelog](../CHANGELOG.md)

</div>

---

## 🌟 What is StarCanvas?

StarCanvas is a powerful local desktop AI creation workbench designed for modern AI creators. It integrates text, images, videos, audio, agents, and project materials into a unified canvas environment, making it easy to build, manage, and optimize complete AI generation pipelines.

### 🎯 Core Values

- **🎨 Visual Workflow** — Connect prompts, reference materials, generation results, and post-processing nodes into an editable creation flowchart
- **📦 Reusable Assets** — Unified media resource management, say goodbye to repeated downloads, copies, and file searching
- **⚙️ Portable Configuration** — Centralized management of model services, API configs, agent knowledge, and local tools for long-term project maintenance
- **👥 Team Collaboration** — New workspace feature in v1.3.0+, supporting team project sharing and collaboration
- **🔧 Offline Toolpack** — Built-in extension tool installer with support for local media processing and enhanced features

### 💎 Use Cases

- AI image/video generation and editing workflows
- Multi-model creative experiments and prompt iteration
- Creative project asset management and organization
- Agent-assisted content planning and generation
- Team collaboration on AI creation projects

---

## 🚀 Key Features

### 📐 Node-based Canvas
Visual editor based on XYFlow, supporting text, image, video, audio, music and other creative nodes for building complex multi-step AI workflows.

### 📚 Resource Library
Centralized view and management of all generated and imported materials, with type filtering, source filtering, favorites, downloads, and one-click reuse to canvas.

### 🤖 Agent Workbench
Create dedicated AI agents for different tasks, bind specific models, role settings, and knowledge bases, and organize ideas and optimize prompts through conversation.

### ✅ Task List
Unified tracking of all async generation tasks, real-time progress viewing, result refresh, failed task handling, keeping creation workflow organized.

### 👥 Workspace Collaboration `v1.3.0 NEW`
Team project management features:
- Create and manage team workspaces
- Project sharing and collaboration
- Member permission management
- Cross-device synchronization

### 🛠️ Offline Toolpack `v1.3.0 NEW`
Built-in extension tool installer:
- ffmpeg video processing
- Qwen-TTS local speech synthesis
- Real-ESRGAN image enhancement
- Deface face blurring
- One-click installation, cross-platform support

### ⚙️ Model & API Configuration
Maintain Base URLs, API Keys, model lists, and protocol mappings through Config Butler, flexibly adapting to various relay stations and model services.

### 🎬 Jimeng / Seedance Workflow
Complete video generation pipeline:
- Reference image/video upload
- Tianji portrait material library
- Multiple upload channels (temporary link, Volcengine TOS, Qiniu, etc.)
- Video generation task tracking

### 💾 Project & Backup
Project switching, group management, import/export, backup center, and cross-device migration to ensure data security for long-term projects.

---

## 📥 Installation

### Supported Platforms

| Platform | Architecture | Download |
|----------|--------------|----------|
| macOS | Apple Silicon (arm64) | [StarCanvas-1.4.5-arm64.dmg](../../releases/latest) |
| Windows | x64 | [StarCanvas-1.4.5-x64.exe](../../releases/latest) |

---

## 🛠️ Development

### Requirements
- Node.js 16+
- npm or pnpm

### Run from Source

```bash
# Clone repository
git clone https://github.com/Guan-XX003/StarCanvas.git
cd StarCanvas

# Install dependencies
npm install

# Start development mode
npm start

# Or start development server
npm run start:dev
```

### Build Installers

```bash
# Build for current platform
npm run build

# Build for Windows (x64 + x86)
npm run build:win

# Build for Windows x64 only
npm run build:win:x64

# Build for Windows x86 only
npm run build:win:x86
```

Build artifacts output to `release/` directory.

---

## 🏗️ Tech Stack

- **Electron** - Cross-platform desktop framework
- **React 19** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Zustand** - State management
- **XYFlow** - Node canvas engine
- **GSAP** - Animation library
- **Lucide** - Icon library

---

## 📋 Latest Updates

### v1.4.5 (2026-06-29)
- 🌐 Added an official website button next to update checking
- 🛡️ Packaged builds now ignore development user-data overrides

### v1.3.4 (2026-06-27)
- 📦 Released official macOS and Windows installers
- 📜 Clarified the project license for noncommercial use

### v1.3.3 (2026-06-26)
- 🎨 Optimized graphite theme controls, boundaries, and selected states
- 🌐 Added built-in language pack runtime coverage for more deferred UI
- 🛠️ Improved bundled Deface offline runtime packaging and verification

### v1.3.2 (2026-06-24)
- 🎨 Enhanced canvas rendering performance
- 🔧 Improved Tianji configuration sync
- 🐛 Fixed multiple stability issues

### v1.3.1 (2026-06-23)
- 👥 Refined workspace collaboration
- 🔧 Optimized Tianji API logic
- 🐛 Fixed workspace loading issues

### v1.3.0 (2026-06-22)
- ✨ **Major Update**: Workspace & team collaboration
- 🛠️ New offline toolpack management
- 🎨 Optimized boot themes

[View Full Changelog →](../CHANGELOG.md)

---

## 🔒 Data & Privacy

StarCanvas saves all project data, configurations, task records, and media materials **locally only**.

### Data Storage
- **macOS**: `~/Library/Application Support/wanjuan-lingjing/`
- **Windows**: `%APPDATA%/wanjuan-lingjing/`

### Security
- All API Keys stored locally only
- Media files saved to user-specified local directories
- Project backups support encrypted export

---

## 💬 Feedback & Support

- 📝 [Submit Issue](../../issues)
- 💡 [Feature Request](../../discussions)

---

## 📜 License & Attribution

This project is licensed under the [PolyForm Noncommercial License 1.0.0](../LICENSE).

Personal learning, research, noncommercial use, and noncommercial derivative development are allowed. Commercial sale, commercial deployment, SaaS hosting, paid redistribution, commercial integration, or other for-profit use of this project or derivative versions requires prior written permission from the author.

This project took inspiration from YiMao Canvas and similar AI creation workflow tools, while its source code, desktop architecture, UI organization, and current feature implementation are independently developed in this repository.

**Project Goals:**
- Provide an independent desktop creation experience
- Support custom relay stations and model configs
- Facilitate localization and feature extensions

---

<div align="center">

**Made with ❤️ for AI Creators**

</div>
