# Gemini CLI Installation and Setup Guide

This guide provides step-by-step instructions for installing and running the Gemini CLI from scratch on Windows, macOS, and Linux.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Authentication Setup](#authentication-setup)
4. [First Run and Configuration](#first-run-and-configuration)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)
7. [Development Setup](#development-setup)

## Prerequisites

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+, CentOS 7+, etc.)
- **Node.js**: Version 20.0.0 or higher
- **Git**: For development setup (optional for basic usage)
- **Internet Connection**: Required for authentication and API access

### Installing Node.js

#### Windows
1. Visit [nodejs.org](https://nodejs.org/en/download)
2. Download the LTS version (20.x or higher)
3. Run the installer and follow the setup wizard
4. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

#### macOS
Using Homebrew (recommended):
```bash
brew install node
```

Or download from [nodejs.org](https://nodejs.org/en/download)

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Linux (CentOS/RHEL/Fedora)
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### Installing Git (for development)

#### Windows
Download from [git-scm.com](https://git-scm.com/download/win)

#### macOS
```bash
brew install git
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install git

# CentOS/RHEL/Fedora
sudo yum install git
```

## Installation Methods

### Method 1: Quick Start (Recommended for most users)

The fastest way to get started is using npx:

```bash
npx https://github.com/google-gemini/gemini-cli
```

This will download and run the latest version without installing anything permanently.

### Method 2: Global Installation

Install the CLI globally on your system:

```bash
npm install -g @google/gemini-cli
```

Then run from anywhere:
```bash
gemini
```

### Method 3: Development Setup (For contributors)

If you want to contribute to the project or run from source:

```bash
# Clone the repository
git clone https://github.com/google-gemini/gemini-cli.git
cd gemini-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run from source
npm start
```

## Authentication Setup

The Gemini CLI requires authentication with Google's AI services. You need to configure **one** of the following methods:

### Option 1: Google Account Login (Recommended for beginners)

This is the simplest method for personal use:

1. Run the CLI for the first time:
   ```bash
   gemini
   ```

2. The CLI will open a web browser for authentication
3. Sign in with your Google account
4. Grant the necessary permissions
5. Return to the terminal - authentication is complete!

**Note**: This method provides up to 60 model requests per minute and 1,000 model requests per day.

### Option 2: Gemini API Key

For more control and higher rate limits:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Set the environment variable:

   **Windows (PowerShell):**
   ```powershell
   $env:GEMINI_API_KEY="YOUR_API_KEY"
   ```

   **Windows (Command Prompt):**
   ```cmd
   set GEMINI_API_KEY=YOUR_API_KEY
   ```

   **macOS/Linux:**
   ```bash
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

4. For permanent setup, add to your shell configuration:
   
   **Windows (PowerShell):**
   ```powershell
   Add-Content $PROFILE 'Set-Item -Path Env:GEMINI_API_KEY -Value "YOUR_API_KEY"'
   ```

   **macOS/Linux (.bashrc/.zshrc):**
   ```bash
   echo 'export GEMINI_API_KEY="YOUR_API_KEY"' >> ~/.bashrc
   source ~/.bashrc
   ```

### Option 3: Vertex AI API Key

For enterprise users with Google Cloud:

1. Visit [Google Cloud Console](https://cloud.google.com/vertex-ai/generative-ai/docs/start/api-keys)
2. Create a new API key
3. Set environment variables:

   **Windows (PowerShell):**
   ```powershell
   $env:GOOGLE_API_KEY="YOUR_API_KEY"
   $env:GOOGLE_GENAI_USE_VERTEXAI="true"
   ```

   **macOS/Linux:**
   ```bash
   export GOOGLE_API_KEY="YOUR_API_KEY"
   export GOOGLE_GENAI_USE_VERTEXAI=true
   ```

### Option 4: Google Workspace Accounts

If you have a Google Workspace account, you may need to set up a Google Cloud Project:

1. Set the project ID:
   ```bash
   export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
   ```

2. Enable the Gemini API in your Google Cloud Console
3. Configure access permissions

## First Run and Configuration

### Initial Setup

1. Run the CLI:
   ```bash
   gemini
   ```

2. Choose a color theme when prompted
3. Complete authentication (if not already done)
4. The CLI will start and show a welcome message

### Basic Commands

Once the CLI is running, you can interact with it:

```bash
# Ask questions about your code
> What does this function do?

# Get help
> /help

# Exit the CLI
> /exit
```

### Configuration Files

The CLI uses configuration files for persistent settings:

- **Global config**: `~/.gemini/config.json`
- **Project config**: `.gemini/config.json` (in project directories)
- **Environment variables**: `.gemini/.env` or `.env`

## Usage Examples

### Exploring a Codebase

```bash
# Navigate to a project
cd my-project
gemini

# Ask about the architecture
> Describe the main pieces of this system's architecture

# Check for security issues
> What security mechanisms are in place?
```

### Working with Code

```bash
# Get help with implementation
> Implement a first draft for GitHub issue #123

# Migration assistance
> Help me migrate this codebase to the latest version of Java. Start with a plan
```

### System Integration

```bash
# File operations
> Convert all images in this directory to PNG format

# Document organization
> Organize my PDF invoices by month of expenditure
```

### Automation

```bash
# Create presentations
> Make me a slide deck showing the git history from the last 7 days

# Build applications
> Create a web app for displaying GitHub issues on a wall display
```

## Troubleshooting

### Common Issues

#### Node.js Version Issues
**Problem**: "Node.js version 20 or higher required"
**Solution**: Update Node.js to version 20 or higher

#### Authentication Errors
**Problem**: "Authentication failed" or "Invalid API key"
**Solution**: 
- Verify your API key is correct
- Check that environment variables are set properly
- Try re-authenticating with Google account login

#### Network Issues
**Problem**: "Connection timeout" or "Network error"
**Solution**:
- Check your internet connection
- Verify firewall settings
- Try using a different network

#### Permission Issues (Linux/macOS)
**Problem**: "Permission denied" when installing globally
**Solution**:
```bash
sudo npm install -g @google/gemini-cli
```

### Getting Help

- **Documentation**: [docs/index.md](./docs/index.md)
- **Troubleshooting Guide**: [docs/troubleshooting.md](./docs/troubleshooting.md)
- **GitHub Issues**: [GitHub Issues](https://github.com/google-gemini/gemini-cli/issues)

## Development Setup

### Prerequisites for Development

- Node.js version 20.19.0 (specific version required for development)
- Git
- Docker (optional, for sandboxing)

### Building from Source

```bash
# Clone the repository
git clone https://github.com/google-gemini/gemini-cli.git
cd gemini-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run from source
npm start
```

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# All checks (linting, formatting, tests)
npm run preflight
```

### Sandboxing (Optional)

For enhanced security, enable sandboxing:

1. Set environment variable:
   ```bash
   export GEMINI_SANDBOX=true
   ```

2. Install Docker or Podman for container-based sandboxing

3. Build with sandbox support:
   ```bash
   npm run build:all
   ```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run preflight`
5. Submit a pull request

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Uninstallation

### Global Installation
```bash
npm uninstall -g @google/gemini-cli
```

### Development Setup
```bash
# Remove the cloned repository
rm -rf gemini-cli

# Clean npm cache (optional)
npm cache clean --force
```

### Configuration Cleanup
```bash
# Remove configuration files
rm -rf ~/.gemini
rm -f ~/.env  # if you added Gemini variables here
```

For more detailed uninstallation instructions, see [docs/Uninstall.md](./docs/Uninstall.md).

---

## Quick Reference

### Installation Commands
```bash
# Quick start
npx https://github.com/google-gemini/gemini-cli

# Global install
npm install -g @google/gemini-cli

# Development setup
git clone https://github.com/google-gemini/gemini-cli.git
cd gemini-cli && npm install && npm run build
```

### Authentication Commands
```bash
# Google account login (automatic)
gemini

# API key setup
export GEMINI_API_KEY="your-api-key"
gemini

# Vertex AI setup
export GOOGLE_API_KEY="your-api-key"
export GOOGLE_GENAI_USE_VERTEXAI=true
gemini
```

### Common CLI Commands
```bash
gemini                    # Start the CLI
gemini --help            # Show help
gemini --version         # Show version
gemini --config          # Show configuration
```

This guide should get you up and running with the Gemini CLI quickly. For more advanced features and detailed documentation, refer to the [official documentation](./docs/index.md). 