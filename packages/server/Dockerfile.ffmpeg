# Copyright 2021 Google LLC
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#      http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Use the official lightweight Node.js image.
# https://hub.docker.com/_/node
FROM node:22-slim

RUN apt-get update && \
    apt-get install -y \
    wget \
    xz-utils


# Install the specified version of FFmpeg
ENV FFMPEG_VERSION="7.0.2"
RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-${FFMPEG_VERSION}-amd64-static.tar.xz && \
    tar -xf ffmpeg-${FFMPEG_VERSION}-amd64-static.tar.xz && \
    cp ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ && \
    cp ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ && \
    rm -rf ffmpeg-*-amd64-static ffmpeg-${FFMPEG_VERSION}-amd64-static.tar.xz

# Verify FFmpeg installation
RUN ffmpeg -version

# Install canvas dependencies
RUN apt-get install -y libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++
RUN apt-get install -y libgl1-mesa-dev xvfb libxi-dev libx11-dev

RUN apt-get install python3 && ln -sf python3 /usr/bin/python


# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install dependencies.
RUN yarn install

# Copy local code to the container image.
COPY . ./

# Run the web service on container startup.
ENTRYPOINT ["node", "dist/index.cjs"]
