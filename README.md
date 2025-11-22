# Playwright Capture Script Walkthrough

I have created a Node.js script that uses Playwright to automate the login and screenshot process, and Sharp to convert the image to a grayscale GIF.

## Prerequisites

- Node.js installed.
- Dependencies installed (`npm install`).

## How to Run

You need to set the following environment variables:

- `LOGIN_URL`: The URL of the login page.
- `LOGIN_USERNAME`: Your username (preferred over `USERNAME` to avoid system conflicts).
- `USERNAME`: Fallback username if `LOGIN_USERNAME` is not set.
- `PASSWORD`: Your password.
- `TARGET_URL`: The URL to navigate to after login (or after account selection).
- `ACCOUNT_NAME`: (Optional) The name of the child/account to click after login (e.g., "Mila Klaudel (ZSF)").
- `NAVIGATE_TO_LINK`: (Optional) Text of a link to click after login/account selection (e.g., "Plan zajęć").
- `SELECTOR_TO_SCREENSHOT`: (Optional) CSS selector of the element to screenshot. Defaults to full page if omitted.

### Example Command

```bash
LOGIN_URL="https://example.com/login" \
LOGIN_USERNAME="myuser" \
PASSWORD="mypassword" \
TARGET_URL="https://example.com/dashboard" \
SELECTOR_TO_SCREENSHOT=".main-content" \
node capture.js
```

### Optional Configuration

You can also override the default selectors if the website uses different ones:

- `USERNAME_SELECTOR`: Default `input[name="Alias"]`
- `NEXT_BUTTON_SELECTOR`: Default `button:has-text("Dalej"), button[id="btNext"]`
- `PASSWORD_SELECTOR`: Default `input[name="password"], input[type="password"]`
- `LOGIN_BUTTON_SELECTOR`: Default `button:has-text("Zaloguj")`
- `CONSENT_BUTTON_SELECTOR`: Default `#save-default-button, button:has-text("Zgadzam się")`

## Output

The script will generate a file named `output.gif` in the current directory.
