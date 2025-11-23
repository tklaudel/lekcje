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

## Deployment (Local Network)

To run this script on a local machine via GitHub Actions:

### 1. Setup Self-Hosted Runner

1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Actions** > **Runners**.
3.  Click **New self-hosted runner**.
4.  Select your OS and architecture.
5.  Run the provided commands on your local machine to install and start the runner.

### 2. Configure Secrets

1.  Go to **Settings** > **Secrets and variables** > **Actions**.
2.  Add the following repository secrets:
    - `LOGIN_USERNAME`: Your login email/username.
    - `PASSWORD`: Your password.
    - `ACCOUNT_NAME`: (Optional) Name of the account to select.

### 3. Run Workflow

The workflow is configured to run:
- **Automatically**: Mon-Fri at 6:00 AM CET.
- **Manually**: Go to **Actions** tab > **Run Playwright Script** > **Run workflow**.
- **Via CLI**:
  ```bash
  gh workflow run run_script.yml
  ```

The generated GIF will be available as an artifact in the workflow run summary.
