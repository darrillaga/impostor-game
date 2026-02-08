# Dev Container Setup

This project includes a VS Code Dev Container configuration for a consistent development environment.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/darrillaga/impostor-game.git
   cd impostor-game
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Add your API keys** to `.env`:
   - Get OpenAI API key from: https://platform.openai.com/api-keys
   - Get Pinecone API key from: https://app.pinecone.io/

4. **Open in VS Code**
   ```bash
   code .
   ```

5. **Reopen in Container**
   - Press `F1` or `Cmd+Shift+P`
   - Select: **"Dev Containers: Reopen in Container"**
   - Wait for container to build (first time takes 2-5 minutes)

6. **Development server starts automatically** at http://localhost:3000

## What's Included

- **Node.js 20** with npm
- **TypeScript** and all project dependencies
- **VS Code extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Jest
  - GitHub Copilot

## Services

### Pinecone (Cloud Service)
Pinecone is a **cloud-hosted vector database** and cannot run locally. You need to:
1. Sign up at https://www.pinecone.io/
2. Create a new index called `impostor-game-memory`
3. Add your API key to `.env`

### Application
- **Port 3000**: Next.js app with Socket.io
- **Port 9229**: Node.js debugger (if needed)

## Useful Commands

Inside the container terminal:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run AI test suite
npm run ai:test

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Container won't start
- Ensure Docker Desktop is running
- Try: `Docker: Rebuild Container` from command palette

### Port already in use
- Stop any local Node.js processes running on port 3000
- Or change PORT in `.env`

### Dependencies not installing
- Run `npm install` manually in container terminal
- Check your internet connection

### Pinecone connection errors
- Verify your API key in `.env`
- Check that your index name matches
- Ensure you're using the correct environment/region

## Additional Resources

- [Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Project Documentation](../README.md)
