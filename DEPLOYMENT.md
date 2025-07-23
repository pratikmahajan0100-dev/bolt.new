# Deploying Imoogle Build to Vercel

This guide will help you deploy **Imoogle Build** to Vercel.

## Prerequisites

Before deploying, you'll need:

1. **AI Provider API Keys** (at least one):
   - [Mistral API Key](https://console.mistral.ai/) - Primary provider
   - [Groq API Key](https://console.groq.com/) - Fallback provider

2. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/imoogle-build)

## Manual Deployment

### 1. Clone and Setup

```bash
git clone <your-repository-url>
cd imoogle-build
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file for local development:

```bash
# AI Provider API Keys (at least one is required)
MISTRAL_API_KEY=your_mistral_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Optional: Debug level
DEBUG_LEVEL=info
VITE_LOG_LEVEL=info
```

### 3. Local Development

```bash
# Start development server
pnpm dev

# Build for production (test before deploying)
pnpm build

# Preview production build locally
pnpm preview
```

### 4. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add MISTRAL_API_KEY
vercel env add GROQ_API_KEY
```

#### Option B: Using Vercel Dashboard

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**
   - Framework Preset: **Remix**
   - Build Command: `pnpm build`
   - Output Directory: `build`
   - Install Command: `pnpm install`

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `MISTRAL_API_KEY` | Your Mistral API key | Production, Preview |
   | `GROQ_API_KEY` | Your Groq API key | Production, Preview |

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

## Configuration Details

### Vercel Configuration

The project includes a `vercel.json` file with the following configuration:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "remix",
  "outputDirectory": "build",
  "env": {
    "MISTRAL_API_KEY": "@mistral_api_key",
    "GROQ_API_KEY": "@groq_api_key"
  },
  "functions": {
    "app/routes/api.*.ts": {
      "maxDuration": 30
    }
  }
}
```

### AI Provider Fallback Logic

- **Primary**: Mistral AI (if `MISTRAL_API_KEY` is provided)
- **Fallback**: Groq (if `GROQ_API_KEY` is provided)
- **Error**: If neither API key is provided, the app will throw an error

### Supported Models

- **Mistral**: `mistral-large-latest`
- **Groq**: `llama3-8b-8192`

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   pnpm clean
   pnpm install
   pnpm build
   ```

2. **API Key Issues**
   - Ensure environment variables are set correctly in Vercel dashboard
   - Verify API keys are valid and have sufficient credits

3. **Memory/Timeout Issues**
   - API routes have a 30-second timeout limit
   - Large responses are streamed to avoid memory issues

### Environment Variables Not Working

1. **Check Variable Names**
   - Must be exactly: `MISTRAL_API_KEY` and/or `GROQ_API_KEY`
   - Case sensitive

2. **Check Environment Scope**
   - Set for both "Production" and "Preview" environments
   - Redeploy after adding new environment variables

### Performance Optimization

1. **Code Splitting**: The app automatically splits code for better performance
2. **Streaming**: API responses are streamed to handle large responses
3. **Caching**: Static assets are automatically cached by Vercel

## Monitoring

- **Vercel Analytics**: Monitor performance and usage
- **Function Logs**: Check Vercel function logs for API errors
- **Build Logs**: Monitor build process for any issues

## Security

- **Environment Variables**: Never commit API keys to your repository
- **HTTPS**: Vercel automatically provides HTTPS
- **CORS**: Configured for same-origin requests

## Support

If you encounter issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review [Remix Deployment Guide](https://remix.run/docs/en/main/guides/deployment#vercel)
3. Check project issues on GitHub

---

**Note**: This deployment guide assumes you've already completed the rebranding to "Imoogle Build" and have configured Mistral/Groq as your AI providers.