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
vercel env add MISTRAL_API_KEY production
vercel env add GROQ_API_KEY production

# Set for preview environment too
vercel env add MISTRAL_API_KEY preview
vercel env add GROQ_API_KEY preview
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
   | `MISTRAL_API_KEY` | `your-actual-mistral-api-key` | Production, Preview |
   | `GROQ_API_KEY` | `your-actual-groq-api-key` | Production, Preview |

   **Important**: 
   - Enter the actual API key values, not references
   - Make sure to select both "Production" and "Preview" environments
   - The variable names are case-sensitive

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
  "functions": {
    "app/routes/api.*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Note**: Environment variables are set directly in the Vercel dashboard or CLI, not in the `vercel.json` file.

### AI Provider Fallback Logic

- **Primary**: Mistral AI (if `MISTRAL_API_KEY` is provided)
- **Fallback**: Groq (if `GROQ_API_KEY` is provided)
- **Error**: If neither API key is provided, the app will throw an error

### Supported Models

- **Mistral**: `mistral-large-latest`
- **Groq**: `llama3-8b-8192`

## Troubleshooting

### Environment Variable Issues

1. **"Secret does not exist" Error**
   - This happens when environment variables are not set correctly
   - Go to Project Settings → Environment Variables in Vercel dashboard
   - Add `MISTRAL_API_KEY` and/or `GROQ_API_KEY` with actual values
   - Redeploy the project

2. **Variables Not Loading**
   - Ensure variables are set for the correct environment (Production/Preview)
   - Variable names must be exactly: `MISTRAL_API_KEY` and `GROQ_API_KEY`
   - Redeploy after adding new environment variables

3. **Build Failures**
   ```bash
   # Clear cache and rebuild
   pnpm clean
   pnpm install
   pnpm build
   ```

### Common Issues

1. **API Key Issues**
   - Ensure environment variables are set correctly in Vercel dashboard
   - Verify API keys are valid and have sufficient credits
   - Check that you're using the correct API key format

2. **Memory/Timeout Issues**
   - API routes have a 30-second timeout limit
   - Large responses are streamed to avoid memory issues

### Step-by-Step Environment Variable Setup

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" tab
   - Click "Environment Variables" in the sidebar
   - Click "Add New"
   - Enter `MISTRAL_API_KEY` as name
   - Enter your actual Mistral API key as value
   - Select "Production" and "Preview" environments
   - Click "Save"
   - Repeat for `GROQ_API_KEY` if you have one

2. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." menu on latest deployment
   - Click "Redeploy"

## Performance Optimization

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