FROM golang:1.23-alpine AS builder
WORKDIR /src
RUN apk add --no-cache git
COPY . .
RUN go env -w GOPROXY=direct && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/nexus ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /out/nexus /app/nexus
EXPOSE 8080
ENV PORT=8080
CMD ["/app/nexus"]
