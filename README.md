# Playwright Capture Script

A configurable Node.js application that uses Playwright to automate login, navigation, and screenshot capture, converting the result to a grayscale GIF.

## Features

- **Configurable Flow**: Define steps in a `flow.yaml` file.
- **Robust Login**: Handles two-step login, consent layers, and account selection.
- **Auto-Scroll**: Ensures full page content is loaded before capturing.
- **Image Processing**: Converts screenshots to grayscale GIFs.

## Prerequisites

- Node.js installed.
- Dependencies installed:
  ```bash
  npm install
  ```

## Configuration (`flow.yaml`)

Create a YAML file (default `flow.yaml`) to define your flow:

```yaml
baseUrl: "https://eduvulcan.pl"
login:
  url: "/logowanie"
steps:
  - name: "plan_zajec"
    navigationSelector: "text=Plan zajęć" # Optional: Click this link before screenshot
    screenshotSelector: "section.app_content" # Optional: Defaults to full page
```

## Usage

Run the script with your credentials as environment variables:

```bash
LOGIN_USERNAME="your_email@example.com" \
PASSWORD="your_password" \
ACCOUNT_NAME="kid_name" \
node index.js --config flow.yaml
```

### Options

- `-c, --config <path>`: Path to YAML configuration file (default: `flow.yaml`)
- `--headless`: Run in headless mode (default: `false`)

## Output

Screenshots are saved in the current directory with the format: `{step_name}_{YYYY-MM-DD}.gif`.
