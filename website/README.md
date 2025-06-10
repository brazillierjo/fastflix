# FastFlix Website

The official marketing website for FastFlix - an AI-powered movie and TV show recommendation app that helps users discover their next favorite content through intelligent suggestions and personalized recommendations.

## Overview

This website serves as the primary landing page and information hub for FastFlix, showcasing the app's features, providing user support, and facilitating app downloads across multiple platforms. Built with modern web technologies, it delivers a responsive and engaging user experience while maintaining high performance and accessibility standards.

## Key Features

### 🎯 **Marketing & Conversion**

- Compelling hero section with clear value proposition
- Feature showcase highlighting AI-powered recommendations
- Cross-platform availability (iOS, Android, Web)
- Download buttons with direct app store links
- Responsive design optimized for all devices

### 🌍 **Internationalization**

- Multi-language support (English, French)
- Dynamic language switching
- Localized content and UI elements
- Context-aware translations

### 📞 **User Support**

- Comprehensive FAQ section
- Multiple contact options (email, bug reports, feature requests)
- Privacy policy and terms of service
- Dedicated support page with categorized help topics

### 🎨 **Modern UI/UX**

- Clean, modern design with gradient backgrounds
- Smooth animations and transitions
- Accessible components with proper ARIA labels
- Mobile-first responsive design
- Dark/light theme considerations

## Technology Stack

### **Core Framework**

- **Next.js 15.3.3** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### **Styling & UI**

- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
  - Dialog, Dropdown Menu, Navigation Menu
  - Separator, Slot components
- **Lucide React** - Beautiful icon library
- **Class Variance Authority** - Component variant management

### **Development Tools**

- **ESLint 9** - Code linting with Next.js config
- **Prettier 3.5.3** - Code formatting
- **Turbopack** - Fast development bundler

### **Utilities**

- **clsx & tailwind-merge** - Conditional class management
- **tw-animate-css** - Enhanced animations

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage with hero and features
│   ├── support/           # Support and FAQ page
│   ├── privacy-policy/    # Privacy policy page
│   └── layout.tsx         # Root layout with navigation
├── components/            # Reusable UI components
│   └── ui/               # Shadcn/ui components
├── contexts/             # React contexts
│   └── LanguageContext.tsx # Internationalization
└── lib/                  # Utilities and constants
    ├── constants.ts      # App constants and links
    └── translations.ts   # Translation utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd website
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the website.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Configuration

### Environment Variables

Create a `.env.local` file for environment-specific configurations:

```env
# Add any environment variables here
NEXT_PUBLIC_APP_URL=https://fastflix.app
```

### Constants

Update `src/lib/constants.ts` to modify:

- Contact email addresses
- App store links
- External documentation links
- Company information

### Translations

Add new languages by:

1. Creating translation files in the locales structure
2. Updating the LanguageContext
3. Adding language options to the language selector

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Connect your GitHub repository
2. Configure build settings (auto-detected)
3. Deploy with zero configuration

### Other Platforms

The website can be deployed to any platform supporting Next.js:

- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

### Build Output

```bash
npm run build
```

Generates optimized static files in the `.next` directory.

## Contributing

1. Follow the existing code style and conventions
2. Run `npm run lint` and `npm run format` before committing
3. Test across different devices and browsers
4. Update translations when adding new text content
5. Ensure accessibility standards are maintained

## Performance Optimizations

- **Image Optimization** - Next.js automatic image optimization
- **Font Loading** - Optimized web font loading with `next/font`
- **Code Splitting** - Automatic route-based code splitting
- **Static Generation** - Pre-rendered pages for better performance
- **Turbopack** - Fast development builds

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is part of the FastFlix application suite. All rights reserved.
