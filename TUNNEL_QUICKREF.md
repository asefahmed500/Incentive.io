# Development Tunnel Quick Reference

## One-Line Command

```bash
npm run share
```

## What It Does

1. Starts Next.js dev server (port 3000-3004)
2. Creates Cloudflare tunnel
3. Displays public URL

## Prerequisites

Install cloudflared:
```powershell
winget install --id Cloudflare.cloudflared
```

## Stopping

Press `Ctrl+C` to stop both server and tunnel.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `cloudflared not found` | Install cloudflared (see prerequisites) |
| `Port already in use` | Close apps using ports 3000-3004 |
| `Tunnel URL not found` | Check internet connection |
| `MongoDB connection` | Tunnel only exposes web, not DB |

## Security Notes

⚠️ Public access - Use for development only
⚠️ Enable authentication in your app
⚠️ Don't use with production data

## Full Documentation

See `TUNNEL_SETUP.md` for detailed instructions.
