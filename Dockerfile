# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
# Optionally, expose the port the app runs on (Next.js default is 3000)
# ENV PORT=3000
# EXPOSE ${PORT} # Port exposure is better handled by `docker run -p` or docker-compose

# Copy built assets from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# User for running the app (optional but recommended)
# Create a non-root user and group
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

# Command to run the application
CMD ["node", "server.js"]

# Optional Healthcheck
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl --fail http://localhost:3000 || exit 1
