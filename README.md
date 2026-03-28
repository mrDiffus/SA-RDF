## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Deploy To GitHub Pages

1. Confirm `homepage` in `package.json` matches your Pages URL:
   `https://mrdiffus.github.io/SA-Rdf-Frontend/`
2. Push to `main`.
3. In your GitHub repository settings:
   - Open **Settings -> Pages**
   - Set **Source** to **GitHub Actions**

Optional manual publish from your machine:
- Install dependencies (if not already done):
   `npm install`
- Publish the latest build to the `gh-pages` branch:
   `npm run deploy`

Notes:
- The GitHub workflow is in `.github/workflows/deploy-pages.yml` and runs tests before deploy.
- Vite is configured to use the repository name as a base path on GitHub Actions (`/SA-Rdf-Frontend/`) and `/` locally.
- To override the base path manually, set `VITE_BASE_PATH` before building.
