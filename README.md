# SmartPrep

SmartPrep is a modern web application designed as an educational platform focused on networking and electronics. It provides interactive quizzes and a suite of essential calculation tools for students and professionals in these fields.

---

## ✅ Features

### 📚 Interactive Quizzes

* Applied Networking
* Networking Fundamentals
* Electronics Fundamentals
* Select number of questions (5, 10, 20, All)
* Real-time feedback and scoring
* Review mode to check answers and feedback

### 🧮 Electronics Calculators

* Ohm's Law Calculator (V = IR)
* Electrical Power Calculator (V, I, R, P relationships)
* Series & Parallel Resistance Calculator
* Resistor Tolerance Range Calculator
* AC Instantaneous Voltage Calculator
* Ripple Voltage Calculator (Half/Full Wave, Current/Resistance methods)
* Op-Amp Gain Calculator (Inverting & Non-Inverting)
* BJT Solver (Fixed Bias Common-Emitter)

### 🌐 Networking & Logic Tools

* Subnet Visualizer (IPv4 CIDR)
* Logic Truth Table Generator (Up to 4 variables)
* Base Converter (Binary / Decimal / Hex)
* Resistor Color Code Calculator (4, 5, 6 bands; Value ↔ Bands)
* Packet Flow Simulator (OSI Model visualization)

### 🔊 Audio Lessons

Learn networking and electronics on the go!

* From Router Placement to Transmission
* Why 2.4GHz vs 5GHz matters
* How signals are encoded for transmission

### 🎨 Modern UI/UX

* Clean Tailwind CSS + ShadCN UI design
* Mobile-responsive layout
* Consistent Lucide icon usage
* Dockerized for deployment

---

## ⚙️ Tech Stack

* **Frontend:** Next.js (App Router), React, TypeScript
* **Styling:** Tailwind CSS, ShadCN UI, Lucide React Icons
* **State Management:** React Hooks (`useState`, `useMemo`, `useCallback`, etc.), `usehooks-ts`
* **Utilities:** `clsx`, `tailwind-merge`
* **Testing:** Jest, React Testing Library
* **Deployment:** Docker, Nginx

---

## 📁 Folder Structure

<details>
<summary>Click to view folder structure</summary>

```
smartprep/
├── .env
├── .dockerignore
├── .vscode/
├── README.md
├── components.json
├── docker-compose.yml
├── Dockerfile
├── jest.config.js
├── jest.setup.js
├── next.config.js
├── nginx.conf
├── package.json
├── public/
│   ├── data/
│   │   ├── applied.json
│   │   ├── network_quiz.json
│   │   ├── electronics.json
│   │   └── audio.json
│   └── assets/images/
│       ├── hero-network.jpg
│       └── hero-electronics.jpg
├── src/
│   ├── __tests__/
│   │   ├── calculators/
│   │   └── lib/
│   ├── app/
│   │   ├── calculator/
│   │   ├── quiz/
│   │   ├── audio/
│   │   │   └── page.tsx
│   │   ├── tools/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── calculators/
│   │   ├── layout/
│   │   ├── quiz/
│   │   ├── packet-flow/
│   │   ├── tools/
│   │   ├── ui/
│   │   └── audio/
│   │       └── AudioCard.tsx
│   ├── lib/
│   │   ├── calculator-utils.ts
│   │   ├── osi-model.ts
│   │   ├── quiz-client.ts
│   │   ├── units.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-calculator-state.ts
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   └── types/
│       ├── calculator.ts
│       ├── packet.ts
│       ├── quiz.ts
│       └── audio.ts
├── tailwind.config.ts
└── tsconfig.json
```

</details>

---

## 🚀 Getting Started (Local Development)

```bash
# 1. Clone the repository
git clone <repository-url>
cd smartprep

# 2. Install dependencies
npm install

# 3. Create .env file (optional for now)

# 4. Run the development server
npm run dev
# → Accessible at http://localhost:9002

# 5. Run tests (optional)
npm test
```

---

## 🧠 Quiz JSON Format

Stored in `/public/data/`, each JSON file is an array of question objects:

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
    "answer": "B",
    "feedback": "Switches use MAC addresses to intelligently forward frames only to the intended recipient."
  }
]
```

**Rules:**

* Must be a JSON array `[]`
* Each item must have `question`, `options`, `answer`, and `feedback`
* `options` is a key-value object, and `answer` must match a key

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t smartprep .
```

### Run Container

```bash
docker run -d -p 80:3000 --name smartprep_container --restart always smartprep
```

### Or Use Docker Compose

```bash
docker-compose up -d
```

To stop:

```bash
docker-compose down
```

---

## ☁️ AWS EC2 Deployment Guide

1. Launch EC2 (Ubuntu 22.04 LTS)
2. Install Docker + Docker Compose
3. Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
4. SCP files:

   ```bash
   scp -i your-key.pem -r ./smartprep ubuntu@<ec2-ip>:/home/ubuntu/
   ```
5. SSH into EC2, run:

   ```bash
   docker-compose up -d --build
   ```

### Set Up Nginx

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/smartprep
# Add config and symlink it
sudo ln -s /etc/nginx/sites-available/smartprep /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### HTTPS via Certbot (Optional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🛠️ Contributing

* Run `npm test` before commits
* Edit `/public/data/` to add new questions
* New calculators/tools:

  * Create in `src/components/calculators/` or `/tools/`
  * Add logic to `src/lib/`
  * Link from `src/app/`
  * Update nav (`Header.tsx`)
  * Add tests

---

## 🌐 Browser Compatibility

Tested on latest Chrome + Firefox. Edge and Safari expected to work.

---

## 📄 License

Specify license here (e.g., MIT, Apache 2.0)
