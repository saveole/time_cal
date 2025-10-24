FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install air for hot reload
RUN go install github.com/cosmtrek/air@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Copy air config
COPY .air.toml .

EXPOSE 8080

CMD ["air"]