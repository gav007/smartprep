# SmartPrep

This is a Next.js application providing interactive quizzes and tools for networking and electronics concepts.

## Features

- Interactive Quizzes (Networking Fundamentals, Applied Networking)
- Question Review with Correct/Incorrect Highlighting
- AI-Powered Answer Explanations (using Genkit)
- Electronics & Networking Calculator Tools
  - Subnet Calculator
  - Base Converter (Binary/Decimal/Hex)
  - Resistor Color Code Calculator
  - Waveform Generator

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS + ShadCN UI
- Genkit (for AI features)
- Lucide React (Icons)
- Recharts (for Waveform Generator)

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
    - Copy `.env.example` to `.env` (if it exists).
    - Add your `GOOGLE_GENAI_API_KEY` to the `.env` file:
      ```dotenv
      GOOGLE_GENAI_API_KEY=your_api_key_here
      ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The app will be available at http://localhost:9002 (or the port specified in `package.json`).

5.  **Run Genkit Dev Server (for AI features):**
    In a separate terminal:
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
docker run -d -p 3000:3000 --name smartprep_container smartprep
```

- `-d`: Run in detached mode (background).
- `-p 3000:3000`: Map port 3000 on your host machine to port 3000 inside the container.
- `--name smartprep_container`: Assign a name to the container for easier management.
- `smartprep`: The name of the image to run.

The application will be accessible at `http://<your-server-ip>:3000` or `http://localhost:3000` if running locally.

**Note on Environment Variables with `docker run`:** If your application requires environment variables (like `GOOGLE_GENAI_API_KEY`), you need to pass them during the `docker run` command:

```bash
docker run -d -p 3000:3000 \
  -e GOOGLE_GENAI_API_KEY="your_api_key_here" \
  --name smartprep_container smartprep
```
Alternatively, use an `.env` file:
```bash
docker run -d -p 3000:3000 \
  --env-file ./.env.production \
  --name smartprep_container smartprep
```
*(Make sure `.env.production` exists and contains the necessary variables)*

#### Option 2: Using `docker-compose` (for local testing)

The provided `docker-compose.yml` file simplifies running the container locally.

```bash
docker-compose up -d
```

This command will build the image (if not already built) and start the container defined in `docker-compose.yml`.

To stop the container:
```bash
docker-compose down
```

### Deployment to AWS EC2 (Example Workflow)

1.  **Launch an EC2 Instance:** Choose an appropriate Linux distribution (e.g., Ubuntu, Amazon Linux 2). Ensure Docker is installed on the instance.
2.  **Transfer the Docker Image:**
    *   **Option A (Push to Registry):** Push the built image to a container registry (like Docker Hub, AWS ECR) and pull it on the EC2 instance.
        ```bash
        # On your local machine (after building)
        docker tag smartprep your-dockerhub-username/smartprep:latest
        docker push your-dockerhub-username/smartprep:latest

        # On the EC2 instance
        docker pull your-dockerhub-username/smartprep:latest
        docker run -d -p 3000:3000 ... your-dockerhub-username/smartprep:latest
        ```
    *   **Option B (Copy Files & Build):** Copy the entire project folder (excluding ignored files) to the EC2 instance and build the image directly there using `docker build -t smartprep .`.
3.  **Run the Container:** Use the `docker run` command described above on the EC2 instance. Remember to pass necessary environment variables.
4.  **Configure Security Group:** Ensure the EC2 instance's security group allows incoming traffic on port 3000 (or port 80/443 if using a reverse proxy).
5.  **Set up Reverse Proxy (Recommended):**
    *   Install Nginx on the EC2 instance.
    *   Configure Nginx as a reverse proxy to forward requests from port 80 (and 443 for HTTPS) to the container's port 3000. Use the provided `nginx.conf` as a template (`/etc/nginx/sites-available/smartprep`).
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
