# SmartPrep

SmartPrep is a modern web application designed as an educational platform focused on networking and electronics. It provides interactive quizzes, a suite of essential calculation tools, and practical utilities for students and professionals in these fields.

## Features

*   **Interactive Quizzes:**
    *   Applied Networking
    *   Networking Fundamentals
    *   Select number of questions (5, 10, 20, All)
    *   Real-time feedback and scoring
    *   Review mode to check answers and feedback
*   **Electronics Calculators:**
    *   Ohm's Law Calculator (V=IR)
    *   Electrical Power Calculator (V, I, R, P relationships)
    *   Series & Parallel Resistance Calculator
    *   Resistor Tolerance Range Calculator
    *   AC Instantaneous Voltage Calculator
    *   Ripple Voltage Calculator (Half/Full Wave, Current/Resistance methods)
    *   Op-Amp Gain Calculator (Inverting & Non-Inverting)
    *   BJT Solver (Fixed Bias Common-Emitter)
*   **Networking & Logic Tools:**
    *   Subnet Visualizer (IPv4 CIDR)
    *   Logic Truth Table Generator (Up to 4 variables)
    *   Base Converter (Binary/Decimal/Hexadecimal)
    *   Resistor Color Code Calculator (4, 5, 6 bands; Value-to-Bands & Bands-to-Value)
    *   Packet Flow Simulator (OSI Model visualization)
*   **Modern UI/UX:**
    *   Clean, professional design using Tailwind CSS and ShadCN UI.
    *   Responsive layout for desktop and mobile devices.
    *   Consistent use of Lucide icons.
    *   Dockerized for easy deployment.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **Styling:** Tailwind CSS, ShadCN UI, Lucide React Icons
*   **State Management:** React Hooks (`useState`, `useMemo`, `useCallback`, `useRef`, `useEffect`), `usehooks-ts` (for debounce)
*   **Utilities:** `clsx`, `tailwind-merge`
*   **Testing:** Jest, React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
*   **Deployment:** Docker, Nginx (example provided)

## Folder Structure

```
smartprep/
├── .env                  # Environment variables
├── .dockerignore         # Files to exclude from Docker build
├── .vscode/             # VS Code settings
├── README.md             # Project documentation (This file)
├── components.json       # ShadCN UI configuration
├── docker-compose.yml    # Docker Compose for local development/testing
├── Dockerfile            # Defines Docker image build process
├── jest.config.js        # Jest test runner configuration
├── jest.setup.js         # Jest setup file
├── next.config.js        # Next.js configuration
├── nginx.conf            # Nginx reverse proxy example configuration
├── package.json          # Project dependencies and scripts
├── public/               # Static assets served directly
│   ├── data/             # JSON files containing quiz questions
│   │   ├── applied.json
│   │   └── network_quiz.json
│   └── assets/           # Images and other static files
│       └── images/       # Application images (hero, diagrams, etc.)
├── src/                  # Application source code
│   ├── __tests__/        # Jest/React Testing Library tests
│   │   ├── calculators/
│   │   ├── quiz/
│   │   └── lib/
│   ├── app/              # Next.js App Router pages and layouts
│   │   ├── calculator/   # Calculator tool sections/pages
│   │   ├── quiz/         # Quiz selection and player pages
│   │   ├── tools/        # Standalone tools (subnet, resistor, etc.)
│   │   ├── layout.tsx    # Root layout component
│   │   └── page.tsx      # Home page component
│   ├── components/       # Reusable React components
│   │   ├── calculators/  # Individual calculator components
│   │   ├── layout/       # Header, Footer components
│   │   ├── quiz/         # Quiz UI components (QuizCard, Controls, Review)
│   │   ├── packet-flow/  # Components for Packet Flow Simulator
│   │   ├── tools/        # Components for tools pages
│   │   └── ui/           # ShadCN generated UI components (Button, Card, etc.)
│   ├── lib/              # Utility functions and libraries
│   │   ├── calculator-utils.ts # Core logic for calculators
│   │   ├── osi-model.ts      # Logic for Packet Flow Simulator
│   │   ├── quiz-client.ts  # Client-side quiz helper functions
│   │   ├── units.ts        # Unit definitions and helpers
│   │   ├── utils.ts        # General utilities (e.g., cn for Tailwind)
│   ├── hooks/            # Custom React hooks
│   │   ├── use-calculator-state.ts # State management for multi-input calculators
│   │   ├── use-mobile.ts   # Detect mobile viewport hook
│   │   └── use-toast.ts    # Toast notification hook
│   └── types/            # TypeScript type definitions
│       ├── calculator.ts # Types for calculator inputs/outputs
│       ├── packet.ts     # Types for Packet Flow Simulator
│       └── quiz.ts       # Types for quiz questions/answers
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

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

3.  **Environment Variables:**
    Create a `.env` file in the project root. Currently, no specific keys are strictly required unless external APIs are re-integrated.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:9002` (or the port specified in `package.json`).

5.  **Run Tests (Optional):**
    ```bash
    npm test
    ```

## Quiz JSON Format

Quiz questions are stored as arrays of objects in JSON files within `/public/data/`.

**Structure:**

```json
[
  {
    "question": "Which device connects multiple devices in a LAN and uses MAC addresses to forward data?",
    "options": {
      "A": "Router",
      "B": "Switch",
      "C": "Modem",
      "D": "Hub"
    },
    "answer": "B", // Must match one of the keys in "options"
    "feedback": "Switches use MAC addresses to intelligently forward frames only to the intended recipient."
    // Optional "type": "MC" field is allowed but ignored by current logic.
  },
  // ... more questions
]
```

**Requirements:**

*   The root element must be an array `[]`.
*   Each object must contain `question` (string), `options` (object), `answer` (string), and `feedback` (string).
*   `options` must be an object where keys (e.g., "A", "B") map to string labels.
*   `answer` must be a string corresponding to one of the keys in the `options` object.

## Docker Build & Deployment

This project is configured for Docker deployment.

### Prerequisites

*   Docker installed: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
*   Docker Compose (optional, for local testing): [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

### Building the Docker Image

Navigate to the project root directory and run:

```bash
docker build -t smartprep .
```

This builds the production-ready Docker image named `smartprep` using a multi-stage build to keep the final image small.

### Running the Docker Container

#### Option 1: Using `docker run`

```bash
# Simple run, mapping host port 80 to container port 3000
docker run -d -p 80:3000 --name smartprep_container smartprep
```

*   `-d`: Run in detached mode (background).
*   `-p 80:3000`: Map port 80 on your host to port 3000 inside the container (where Next.js runs).
*   `--name smartprep_container`: Assign a name for easy management.
*   `--restart always`: Ensure the container restarts automatically if it stops.
*   `smartprep`: The image name built previously.

The application will be accessible at `http://<your-server-ip>` or `http://localhost`.

#### Option 2: Using `docker-compose` (for local testing or deployment)

The provided `docker-compose.yml` simplifies running the container.

1.  Ensure you are in the project root directory.
2.  **(Optional)** Create a `.env.production` file if you need to pass environment variables to the container.
3.  Run Docker Compose:
    ```bash
    docker-compose up -d
    ```
    This command builds the image (if needed) and starts the container defined in `docker-compose.yml`. The compose file is configured to map host port 80 to container port 3000 and restart always.

To stop the container:
```bash
docker-compose down
```

## AWS EC2 Deployment Guide (Example)

This is a high-level guide. Your specific AWS setup might vary.

1.  **Launch an EC2 Instance:**
    *   Choose an appropriate Linux distribution (e.g., Ubuntu 22.04 LTS).
    *   Ensure Docker and Docker Compose are installed on the instance. Follow the official Docker installation guide for your chosen OS.
    *   Configure the Security Group to allow incoming traffic on:
        *   Port `80` (for HTTP)
        *   Port `443` (for HTTPS, after setting up Nginx/Certbot)
        *   Port `22` (for SSH access)

2.  **Transfer Project Files:**
    *   Copy your entire project folder (excluding ignored files via `.dockerignore`) to the EC2 instance using `scp` or another method.
        ```bash
        # Example using scp (replace placeholders)
        scp -i /path/to/your-key.pem -r /local/path/to/smartprep ubuntu@<your-ec2-ip>:/home/ubuntu/
        ```

3.  **Build and Run with Docker Compose on EC2:**
    *   SSH into your EC2 instance.
    *   Navigate to the project directory: `cd /home/ubuntu/smartprep`
    *   Build and start the container using Docker Compose:
        ```bash
        docker-compose up -d --build
        ```
        The `--build` flag ensures the image is built on the server. The `-d` flag runs it in the background.

4.  **Set up Nginx as a Reverse Proxy (Recommended for Production):**
    *   Install Nginx on the EC2 instance:
        ```bash
        sudo apt update
        sudo apt install nginx
        ```
    *   Create an Nginx configuration file (e.g., `/etc/nginx/sites-available/smartprep`): Use the `nginx.conf` file in this repository as a template. **Important:** Replace `your-domain.com www.your-domain.com` with your actual domain name(s) or the EC2 instance's public IP if you don't have a domain yet.
        ```bash
        sudo nano /etc/nginx/sites-available/smartprep
        # Paste and edit the content from nginx.conf
        ```
    *   Enable the site by creating a symbolic link:
        ```bash
        sudo ln -s /etc/nginx/sites-available/smartprep /etc/nginx/sites-enabled/
        # Remove the default Nginx site if it exists and conflicts
        sudo rm /etc/nginx/sites-enabled/default
        ```
    *   Test Nginx configuration:
        ```bash
        sudo nginx -t
        ```
    *   Restart Nginx to apply changes:
        ```bash
        sudo systemctl restart nginx
        ```

5.  **Set up Domain Name & HTTPS with Certbot (Optional but Recommended):**
    *   Point your domain name's DNS A record to your EC2 instance's public IP address.
    *   Install Certbot and the Nginx plugin:
        ```bash
        sudo apt install certbot python3-certbot-nginx
        ```
    *   Run Certbot to obtain SSL certificates and automatically configure Nginx for HTTPS:
        ```bash
        sudo certbot --nginx -d your-domain.com -d www.your-domain.com
        ```
        Follow the prompts. Certbot will modify your Nginx configuration to handle HTTPS redirection and certificate renewal.

6.  **Access Your Application:** You should now be able to access your application securely via `http://<your-ec2-ip>` or `https://your-domain.com`.

### Managing the Container

*   **View Logs:** `docker-compose logs -f` (run from the project directory)
*   **Stop:** `docker-compose down`
*   **Start:** `docker-compose up -d`
*   **Remove Container & Image:** `docker-compose down --rmi all`

## Contributing

If you'd like to contribute:

1.  **Testing:** Run `npm test` locally to execute unit tests before committing. Manually test key features (quiz flow, calculators) in the browser, especially on different screen sizes.
2.  **Adding Questions:** Edit the JSON files in `/public/data/`. Ensure the structure matches the format described above.
3.  **Adding Calculators/Tools:**
    *   Create a new component in `/src/components/calculators/` or `/src/components/tools/`.
    *   Add necessary utility functions to `/src/lib/calculator-utils.ts` or a new lib file.
    *   Create a new page route in `/src/app/calculator/` or `/src/app/tools/`.
    *   Update the navigation in `/src/components/layout/Header.tsx`.
    *   Add unit tests for the new logic and UI snapshot tests.
4.  **Code Style:** Follow existing patterns, use TypeScript, and ensure code is linted (`npm run lint`) and type-checked (`npm run typecheck`).

## Browser Compatibility

Tested primarily on the latest versions of Google Chrome and Mozilla Firefox. Compatibility with other modern browsers (Edge, Safari) is expected but not guaranteed without specific testing.

## License

(Specify your license here, e.g., MIT, Apache 2.0, or leave blank if proprietary)
