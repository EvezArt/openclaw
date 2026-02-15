# Base Ubuntu image for devcontainer with multi-language support
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    build-essential \
    curl \
    wget \
    git \
    ca-certificates \
    vim \
    nano \
    unzip \
    zip \
    jq \
    shellcheck \
    && apt-get autoremove -y && apt-get clean -y

# Set up user (features will handle most of the setup)
USER devuser

# Create workspace directory
RUN mkdir -p /workspace

WORKDIR /workspace

# Default command
CMD ["/bin/zsh"]
