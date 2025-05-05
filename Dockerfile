# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
# Use --frozen-lockfile for reproducible installs
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy application code
# Note: .dockerignore should prevent node_modules, .next, etc. from being copied
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
# Uncomment the next line if you need to specify a base path for assets
# ENV NEXT_PUBLIC_API_BASE=/api

# Build the Next.js application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
# Uncomment the next line if you need to specify a base path for assets
# ENV NEXT_PUBLIC_API_BASE=/api

# Copy built assets from the builder stage
# Copy the standalone Next.js server output
COPY --from=builder /app/.next/standalone ./
# Copy the public directory
COPY --from=builder /app/public ./public
# Copy the static assets
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Healthcheck (Optional but recommended)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
# The standalone output includes a server.js file
CMD ["node", "server.js"]
