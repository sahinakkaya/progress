# syntax=docker/dockerfile:1

################################
# GO-BASE  
# Sets up Go environment
################################
FROM golang:1.21-alpine AS go-base

# Install build dependencies
RUN apk add --no-cache \
    git \
    gcc \
    musl-dev \
    sqlite-dev

# Set working directory
WORKDIR /app

################################
# BUILDER
# Build the application
################################
FROM go-base AS builder

# Copy go mod files first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Generate Swagger docs
RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN swag init

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o routine-tracker main.go

################################
# PRODUCTION
# Final runtime image
################################
FROM alpine:latest AS production

# Install runtime dependencies
RUN apk --no-cache add ca-certificates sqlite

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/routine-tracker .

# Copy any static files if needed (docs, etc.)
COPY --from=builder /app/docs ./docs

# Create directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Run the application
CMD ["./routine-tracker"]