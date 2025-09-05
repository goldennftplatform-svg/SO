FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    libudev-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

# Install Solana
RUN sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor
RUN curl -sSf https://raw.githubusercontent.com/coral-xyz/anchor/main/avm/install.sh | sh
ENV PATH="/root/.avm/bin:$PATH"
RUN avm install latest && avm use latest

# Add Solana BPF target
RUN rustup target add bpfel-unknown-unknown

# Set working directory
WORKDIR /app

# Copy your project
COPY . .

# Build command
CMD ["anchor", "build"]
