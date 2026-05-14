#!/bin/bash
# Test: Accessibility checks

set -e

echo "======================================"
echo "Testing Accessibility"
echo "======================================"

# Login as Sales Executive
echo "Logging in as Sales Executive..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'karim@incentive.io'
agent-browser fill 'input[name="password"]' 'Executive123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/a11y-dashboard.png

# Check for semantic HTML
echo "Checking for semantic HTML elements..."
agent-browser eval 'document.querySelector("nav") ? "Nav element found" : "No nav"'
agent-browser eval 'document.querySelector("main") ? "Main element found" : "No main"'
agent-browser eval 'document.querySelector("header") ? "Header element found" : "No header"'

# Check for ARIA labels
echo "Checking for ARIA labels..."
agent-browser eval 'document.querySelectorAll("[aria-label]").length > 0 ? "ARIA labels found" : "No ARIA labels"'
agent-browser eval 'document.querySelectorAll("button[aria-label]").length > 0 ? "Button ARIA labels found" : "No button ARIA labels"'

# Check for alt text on images
echo "Checking for image alt text..."
agent-browser eval 'Array.from(document.querySelectorAll("img")).filter(img => img.alt).length > 0 ? "Images with alt text found" : "No images or alt text"'

# Check form labels
echo "Checking form labels..."
agent-browser eval 'document.querySelectorAll("label").length > 0 ? "Form labels found" : "No form labels"'

# Take accessibility snapshot
agent-browser snapshot --output tests/screenshots/a11y-snapshot.json 2>/dev/null || echo "Snapshot not available"
agent-browser close

echo "✓ Accessibility checks completed"
echo "======================================"
echo "Accessibility testing completed"
echo "======================================"
