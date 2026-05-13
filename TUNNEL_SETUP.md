# Development Tunnel System

A comprehensive development tunnel system for Incentive.io using Cloudflare Tunnel (cloudflared). This allows you to share your local development environment publicly with others for testing, demos, or collaboration.

## Features

- ✅ **Automatic Port Detection** - Finds an available port (3000-3004) automatically
- ✅ **Public URL Generation** - Creates a secure `trycloudflare.com` URL
- ✅ **Zero Configuration** - Works out of the box after setup
- ✅ **Graceful Cleanup** - Automatically stops all processes on exit
- ✅ **Windows Native** - Optimized for Windows with batch script wrapper
- ✅ **Colorful Output** - Clear, styled terminal output for easy reading
- ✅ **Error Handling** - Comprehensive error checking and helpful messages

## Prerequisites

### 1. Install Cloudflare Tunnel (cloudflared)

#### Windows Installation

**Option A: Using Winget (Recommended)**
```powershell
winget install --id Cloudflare.cloudflared
```

**Option B: Manual Installation**

1. Download the latest Windows release from:
   https://github.com/cloudflare/cloudflared/releases/latest

2. Download `cloudflared-windows-amd64.exe`

3. Rename it to `cloudflared.exe`

4. Move it to one of these locations:
   - `C:\Windows\System32\cloudflared.exe` (system-wide)
   - `C:\Users\YourName\AppData\Local\Microsoft\WindowsApps\cloudflared.exe` (user-only)

5. Verify installation:
   ```powershell
   cloudflared --version
   ```

#### Alternative: Scoop Installation
```powershell
scoop bucket add cloudflare
scoop install cloudflared
```

## Usage

### Starting the Development Tunnel

**Option 1: Using npm script (Recommended)**
```bash
npm run share
```

**Option 2: Using the batch file**
```bash
scripts\share.bat
```

**Option 3: Direct node execution**
```bash
node scripts/dev-tunnel.js
```

### Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║ 🚀 NEXT.JS DEVELOPMENT TUNNEL                             ║
╚═══════════════════════════════════════════════════════════╝

🔍 Checking cloudflared installation...
✓ cloudflared found
🔍 Finding available port...
✓ Using port 3000

🚀 Starting Next.js dev server...
✓ Dev server running on http://localhost:3000

🌐 Starting Cloudflare tunnel...
✓ Tunnel established

╔═══════════════════════════════════════════════════════════╗
║ 🌍 YOUR APP IS NOW LIVE                                    ║
╚═══════════════════════════════════════════════════════════╝

  Local URL:   http://localhost:3000
  Public URL:  https://random-name.trycloudflare.com

─────────────────────────────────────────────────────────────
💡 Share the public URL to access your app from anywhere!
⚠️  The tunnel will stop when you press Ctrl+C
─────────────────────────────────────────────────────────────
```

## How It Works

1. **Port Detection**: The script checks ports 3000-3004 to find an available one
2. **Dev Server**: Starts the Next.js development server on the detected port
3. **Tunnel Creation**: Uses cloudflared to create a secure tunnel to the public internet
4. **URL Extraction**: Parses cloudflared output to extract the public `trycloudflare.com` URL
5. **Display**: Shows both local and public URLs in a clear format
6. **Cleanup**: Automatically terminates all processes when you press Ctrl+C

## Stopping the Tunnel

Press `Ctrl+C` in the terminal to stop both the dev server and the tunnel. The script will automatically clean up all processes.

## Troubleshooting

### cloudflared not found

**Error**: `✗ cloudflared is not installed!`

**Solution**: Follow the installation instructions above. After installation, restart your terminal and try again.

### Port already in use

**Error**: `No available ports found`

**Solution**: Close other applications using ports 3000-3004, or modify the `CONFIG.ports` array in `scripts/dev-tunnel.js` to use different ports.

### Tunnel URL not appearing

**Error**: `Tunnel URL not found in output`

**Solution**:
1. Check your internet connection
2. Verify cloudflared is working: `cloudflared --version`
3. Try running cloudflared manually to see detailed logs:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

### MongoDB connection issues

The tunnel only exposes your web server, not MongoDB. If your app requires MongoDB:
- Ensure MongoDB is running locally
- The public URL will only work for web requests
- Database connections must be configured separately

## Security Considerations

⚠️ **Important Security Notes**:

1. **Public Access**: The tunnel makes your local app publicly accessible
2. **Authentication**: Ensure your app has proper authentication enabled
3. **Temporary Use**: This is intended for development/testing only
4. **Sensitive Data**: Don't use with production data or credentials
5. **Session Security**: Sessions may be shared across different users

## Advanced Configuration

### Custom Ports

Edit `scripts/dev-tunnel.js` to modify the ports:

```javascript
const CONFIG = {
  ports: [3000, 3001, 3002, 3003, 3004],
  // Change to your preferred ports
  ports: [8080, 8081, 8082],
};
```

### Custom Host

To use a different host (e.g., for network exposure):

```javascript
const CONFIG = {
  host: "localhost",
  // Change to your network IP or 0.0.0.0
  host: "192.168.1.100",
};
```

### Custom URL Patterns

If using a different tunnel service, modify the URL patterns:

```javascript
const CONFIG = {
  urlPatterns: [
    /https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi,
    // Add your custom patterns here
    /https:\/\/[a-z0-9-]+\.my-tunnel\.com/gi,
  ],
};
```

## Use Cases

1. **Client Demos**: Share your development work with clients remotely
2. **Team Collaboration**: Allow team members to test your local changes
3. **Mobile Testing**: Test your app on mobile devices without deployment
4. **Webhook Testing**: Receive webhooks from external services (Stripe, PayPal, etc.)
5. **Accessibility Testing**: Test with external accessibility tools
6. **Cross-Browser Testing**: Test on browsers not installed locally

## Alternative Tools

If cloudflared doesn't work for you, consider these alternatives:

- **ngrok**: https://ngrok.com/ (Free tier available)
- **localtunnel**: https://localtunnel.github.io/www/ (Free, no signup)
- **serveo**: https://serveo.net/ (Free SSH tunneling)

## Support

For issues with:
- **This script**: Check the troubleshooting section above
- **cloudflared**: Visit https://github.com/cloudflare/cloudflared/issues
- **Next.js**: Visit https://nextjs.org/docs

## License

This tunnel system is part of the Incentive.io project.
