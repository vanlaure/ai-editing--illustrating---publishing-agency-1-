<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Editing, Illustrating & Publishing Agency

A comprehensive AI-powered platform for authors that provides editing, illustration, audiobook production, publishing, and marketing tools powered by Google's Gemini AI.

View your app in AI Studio: https://ai.studio/apps/drive/1UPkFX4FxysFhXK9pGORiFnNzwnvzx2hB

## Features

- **AI-Powered Editing**: Grammar checking, consistency analysis, show vs. tell detection, dialogue analysis, prose polishing, sensitivity reading, and structural analysis
- **Illustration Generation**: Mood boards, character concept art, and cover design using Imagen 4.0
- **Audiobook Production**: Text-to-speech narration with customizable voice styles
- **Video Trailers**: Generate promotional video content using Veo 3.1
- **Publishing Workflow**: Automated metadata generation, cover art creation, and keyword optimization
- **Marketing Suite**: AI-generated marketing campaigns, social media content, and promotional materials
- **Rich Text Editor**: TipTap-powered WYSIWYG editor with advanced formatting
- **World Bible**: Track characters, settings, and series continuity
- **Research Tools**: Import and analyze manuscripts, including Project Gutenberg books
- **Version History**: Track changes and restore previous versions
- **Chat Assistant**: Context-aware AI chat with manuscript knowledge

## System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux
- **Browser**: Modern browser with ES6 support (Chrome, Firefox, Edge, Safari)
- **Memory**: Minimum 4GB RAM recommended
- **API Key**: Google Gemini API key (required)

## Prerequisites

Before running this application, ensure you have:

1. **Node.js and npm** installed
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Google Gemini API Key**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Free tier available with usage limits

## Installation

1. **Clone or download the repository**
   ```bash
   cd ai-editing-agency
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Open `.env.local` in the project root
   - Replace `PLACEHOLDER_API_KEY` with your actual Gemini API key and optionally set the backend URL:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   VITE_API_BASE_URL=http://localhost:4000/api
   # Optional: force the client to skip Gemini Imagen and use the public Pollinations pipeline
   # VITE_IMAGE_BACKEND=pollinations
   ```

## Running the Application

### Start the backend (new)

The backend service powers document indexing, RAG search, compliance scans, and cost planning. It runs separately from the Vite front end.

1. Navigate to the server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Create a `.env` file inside `server/` with your Gemini key:
   ```bash
   GEMINI_API_KEY=your_google_gemini_key
   PORT=4000 # optional
   # Optional: override the Pollinations endpoint the proxy should call
   # POLLINATIONS_BASE_URL=https://image.pollinations.ai/prompt/
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:4000/api`.

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port)

### Build for Production

Create an optimized production build:

```bash
npm run build
```

Build output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Check code quality and style:

```bash
npm run lint
```

### Type Checking

Run TypeScript type checking without building:

```bash
npm run type-check
```

## Project Structure

```
├── components/           # React components
│   ├── icons/           # SVG icon definitions
│   ├── AiPanel.tsx      # AI tools sidebar
│   ├── Editor.tsx       # Main text editor
│   ├── Navbar.tsx       # Top navigation
│   └── ...             # Modal components
├── services/
│   └── geminiService.ts # Google Gemini API integration
├── utils/
│   ├── audioUtils.ts    # Audio processing utilities
│   ├── grammarExtension.ts # TipTap grammar plugin
│   └── searchExtension.ts  # TipTap search plugin
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── index.css            # Global styles and Tailwind imports
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── package.json         # Dependencies and scripts
└── .env.local           # Environment variables (not in git)
```

## Dependencies

### Core Dependencies

- **React 18.3.1**: UI framework
- **TypeScript 5.8.2**: Type-safe JavaScript
- **Vite 6.2.0**: Build tool and dev server
- **TipTap**: Rich text editor
  - @tiptap/react
  - @tiptap/core
  - @tiptap/starter-kit
  - @tiptap/extension-underline
  - @tiptap/extension-image
  - @tiptap/extension-character-count
- **@google/genai 1.24.0**: Google Gemini AI SDK
- **uuid 13.0.0**: Unique ID generation
- **react-to-print 3.2.0**: Document printing
- **pdfjs-dist 4.4.168**: PDF parsing
- **mammoth 1.8.0**: DOCX parsing

### Development Dependencies

- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **@tailwindcss/typography 0.5.15**: Prose styling
- **PostCSS 8.4.49**: CSS processing
- **Autoprefixer 10.4.20**: CSS vendor prefixes
- **ESLint 9.20.0**: Code linting
- **TypeScript ESLint**: TypeScript linting
- **@types/*** Type definitions for TypeScript

## API Usage and Costs

This application uses Google Gemini AI APIs:

- **Text Generation**: gemini-2.5-flash, gemini-2.5-pro
- **Image Generation**: imagen-4.0
- **Video Generation**: veo-3.1-fast
- **Text-to-Speech**: gemini-2.5-flash-preview-tts
- **Image Editing**: gemini-2.5-flash-image

**Important**: API usage incurs costs. Check [Google AI pricing](https://ai.google.dev/pricing) for current rates.

## Features Usage

### Grammar and Style Analysis

- **Live Grammar Check**: Real-time grammar suggestions (enable in AI Panel)
- **Consistency Check**: Detect plot holes and character inconsistencies
- **Show vs. Tell**: Identify "telling" prose and get "showing" suggestions
- **Dialogue Analysis**: Analyze character voice and dialogue quality
- **Prose Polish**: Get suggestions for improving prose quality
- **Sensitivity Reading**: Identify potentially problematic content
- **Structural Analysis**: Analyze pacing, scene structure, and narrative flow

### Illustration Tools

- **Mood Board**: Generate visual references from text descriptions
- **Character Concepts**: Create character art from descriptions
- **Cover Design**: Generate book cover art with customizable prompts

### Publishing Tools

- **Blurb Generation**: AI-generated book descriptions
- **Keyword Extraction**: SEO-optimized keywords for retailers
- **Cover Art Creation**: Automated cover design
- **Image Editing**: Refine generated images with AI editing

### Marketing Tools

- **Campaign Generation**: Complete marketing campaigns
- **Video Trailers**: Promotional video content
- **Social Media Content**: Platform-specific marketing copy

## Troubleshooting

### API Key Issues

**Error: "API key not found" or "Invalid API key"**
- Verify your API key in `.env.local`
- Ensure the variable name is exactly `GEMINI_API_KEY`
- Restart the dev server after changing environment variables

### Build Errors

**Error: "Cannot find module" or type errors**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**
```bash
npm run type-check
```

### Styling Issues

**Tailwind classes not working**
- Ensure `index.css` is imported in `index.tsx`
- Verify Tailwind config includes all file paths
- Restart dev server

### Performance Issues

- Large manuscripts may slow down AI analysis
- Consider processing manuscripts in chunks
- Close unused modals and panels
- Clear browser cache if experiencing slowness

## Development Tips

1. **Hot Module Replacement**: Changes to React components update automatically without full page reload
2. **Type Safety**: Use TypeScript types defined in `types.ts`
3. **Component Structure**: Keep components focused and modular
4. **State Management**: Use React hooks for local state
5. **API Calls**: All AI API calls go through `services/geminiService.ts`

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions  
- Safari: Latest 2 versions

## Security Considerations

- **Never commit** your `.env.local` file or API keys to version control
- API keys are used client-side - consider implementing a backend proxy for production
- Regularly rotate API keys
- Monitor API usage to prevent unexpected charges

## Contributing

When contributing to this project:

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test all AI integrations thoroughly
4. Update documentation for new features
5. Run linting before submitting: `npm run lint`

## License

See LICENSE file for details.

## Support

- **Documentation**: Check this README and code comments
- **Issues**: Report bugs via GitHub issues
- **Google AI**: [Google AI Documentation](https://ai.google.dev/docs)
- **Gemini API**: [Gemini API Reference](https://ai.google.dev/api)

## Acknowledgments

- Built with React, TypeScript, and Vite
- Powered by Google Gemini AI
- TipTap editor for rich text editing
- Tailwind CSS for styling
