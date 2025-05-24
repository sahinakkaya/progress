# Use the official Node.js image with Alpine Linux
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Accept build arg for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN pnpm build

# Install `serve` globally to serve static files
RUN pnpm add -g serve

# Expose the port the app runs on (default for serve is 3000)
EXPOSE 3000

# Command to serve the production build
CMD ["serve", "-s", "dist"]
