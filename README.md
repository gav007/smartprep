# SmartPrep

This is a Next.js application providing interactive quizzes and tools for networking and electronics concepts.

## Features

- Interactive Quizzes (Networking Fundamentals, Applied Networking)
- Question Review with Correct/Incorrect Highlighting
- AI-Powered Answer Explanations (using Genkit with Google Gemini)
- Electronics & Networking Calculator Tools
  - Subnet Calculator
  - Base Converter (Binary/Decimal/Hex)
  - Resistor Color Code Calculator
  - Waveform Generator (Placeholder)
  - Ohm's Law, Power, Series/Parallel Resistance, Tolerance Calculators
  - Op-Amp Gain Calculator
  - BJT Solver (Fixed Bias)

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS + ShadCN UI
- Genkit (for AI features - requires Google AI/Gemini API Key)
- Lucide React (Icons)
- Recharts (for Waveform Generator - placeholder)

## Getting Started (Local Development)

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd smartprep
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    - Copy `.env.example` to `.env` or create a `.env.local` file (preferred for local secrets, ignored by git).
    - Add your Google Generative AI API Key (required for the AI explanation feature) to the `.env` or `.env.local` file:
      ```dotenv
      # .env or .env.local
      GOOGLE_GENAI_API_KEY=your_google_gemini_api_key_here
      ```
      *Note: You can obtain an API key from Google AI Studio or Google Cloud.*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The app will be available at http://localhost:9002 (or the port specified in `package.json`).

5.  **Run Genkit Dev Server (for AI features):**
    The AI explanation feature uses Genkit flows. To test or develop these flows locally, run the Genkit development server in a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    Or for watching changes:
    ```bash
    npm run genkit:watch
    ```

## Docker Deployment

This project is configured for Docker deployment.

### Prerequisites

- Docker installed: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- Docker Compose (optional, for local testing): [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

### Building the Docker Image

Navigate to the project root directory and run:

```bash
docker build -t smartprep .
```

This will build the production-ready Docker image named `smartprep`.

### Running the Docker Container

#### Option 1: Using `docker run`

```bash
docker run -d -p 3000:3000 \
  -e GOOGLE_GENAI_API_KEY="your_google_gemini_api_key_here" \
  --name smartprep_container smartprep
```

- `-d`: Run in detached mode (background).
- `-p 3000:3000`: Map port 3000 on your host machine to port 3000 inside the container.
- `-e GOOGLE_GENAI_API_KEY="your_google_gemini_api_key_here"`: **Crucially, provide the API key as an environment variable.**
- `--name smartprep_container`: Assign a name to the container for easier management.
- `smartprep`: The name of the image to run.

The application will be accessible at `http://<your-server-ip>:3000` or `http://localhost:3000` if running locally.

**Note on Environment Variables:** You MUST provide the `GOOGLE_GENAI_API_KEY` for the AI explanation feature to work. You can also use an environment file with `docker run`:

```bash
# Create a .env.production file (ensure it's not committed if it contains secrets)
echo "GOOGLE_GENAI_API_KEY=your_google_gemini_api_key_here" > .env.production

# Run using the env file
docker run -d -p 3000:3000 \
  --env-file ./.env.production \
  --name smartprep_container smartprep
```

#### Option 2: Using `docker-compose` (for local testing)

The provided `docker-compose.yml` file simplifies running the container locally and includes a placeholder for the environment variable.

1.  **Create a `.env.production` file** (or similar) in the project root and add your API key:
    ```dotenv
    # .env.production
    GOOGLE_GENAI_API_KEY=your_google_gemini_api_key_here
    ```

2.  **Uncomment the `env_file` section** in `docker-compose.yml` if using an env file:
    ```yaml
    services:
      smartprep:
        # ... other settings
        env_file:
          - .env.production # Ensure this matches your filename
    ```

3.  **Run Docker Compose:**
    ```bash
    docker-compose up -d
    ```
    This command will build the image (if not already built) and start the container defined in `docker-compose.yml`, loading the environment variables from the specified file.

To stop the container:
```bash
docker-compose down
```

### Deployment to AWS EC2 (Example Workflow)

1.  **Launch an EC2 Instance:** Choose an appropriate Linux distribution (e.g., Ubuntu, Amazon Linux 2). Ensure Docker is installed on the instance.
2.  **Transfer the Docker Image:**
    *   **Option A (Push to Registry - Recommended):** Push the built image to a container registry (like Docker Hub, AWS ECR) and pull it on the EC2 instance.
        ```bash
        # On your local machine (after building)
        docker tag smartprep your-registry/smartprep:latest
        docker push your-registry/smartprep:latest

        # On the EC2 instance
        docker pull your-registry/smartprep:latest
        docker run -d -p 3000:3000 -e GOOGLE_GENAI_API_KEY="YOUR_KEY" ... your-registry/smartprep:latest
        ```
    *   **Option B (Copy Files & Build):** Copy the entire project folder (excluding ignored files) to the EC2 instance and build the image directly there using `docker build -t smartprep .`.
3.  **Run the Container:** Use the `docker run` command described above on the EC2 instance, ensuring the `GOOGLE_GENAI_API_KEY` environment variable is set correctly.
4.  **Configure Security Group:** Ensure the EC2 instance's security group allows incoming traffic on port 3000 (or port 80/443 if using a reverse proxy).
5.  **Set up Reverse Proxy (Recommended):**
    *   Install Nginx on the EC2 instance.
    *   Configure Nginx as a reverse proxy to forward requests from port 80 (and 443 for HTTPS) to the container's port 3000. Use the provided `nginx.conf` as a template (`/etc/nginx/sites-available/smartprep`). Adapt the `server_name`.
    *   Link the config: `sudo ln -s /etc/nginx/sites-available/smartprep /etc/nginx/sites-enabled/`
    *   Test Nginx config: `sudo nginx -t`
    *   Restart Nginx: `sudo systemctl restart nginx`
    *   Set up a domain name pointing to your EC2 instance's IP address.
    *   Use Certbot to obtain and configure SSL/TLS certificates for HTTPS: `sudo certbot --nginx`

### Managing the Container

-   **View Logs:** `docker logs smartprep_container` (or `docker logs -f smartprep_container` for live logs)
-   **Stop:** `docker stop smartprep_container`
-   **Start:** `docker start smartprep_container`
-   **Remove:** `docker rm smartprep_container` (stop it first)

## Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Creates a production build of the application.
-   `npm run start`: Starts the production server (expects a build to exist).
-   `npm run lint`: Runs ESLint.
-   `npm run typecheck`: Runs TypeScript type checking.
-   `npm run genkit:dev`: Starts the Genkit development flow server.
-   `npm run genkit:watch`: Starts the Genkit development flow server with file watching.
