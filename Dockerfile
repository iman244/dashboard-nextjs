# 1. Use official Node.js image as the build environment
FROM node:20.9-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and package-lock.json
COPY package.json ./
# COPY package-lock.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the application code
COPY . .

# 6. Set production environment and build-time environment variables
ENV NODE_ENV=production

# Build-time environment variables (these will be baked into the build)
ARG NEXT_PUBLIC_DJANGO_ADDRESS
ARG NEXT_PUBLIC_DJANGO_API_PATH
ARG NEXT_PUBLIC_5_160_115_210_ADDRESS
ARG NEXT_PUBLIC_5_160_115_210_API_PATH
ARG NEXT_PUBLIC_AUTHORIZATION_TOKEN_NAME
ARG NEXT_PUBLIC_ACCESS_TOKEN_KEY
ARG NEXT_PUBLIC_REFRESH_TOKEN_KEY
ARG NEXT_PUBLIC_LOCALE_COOKIE_NAME

# Set the build-time args as environment variables for the build
ENV NEXT_PUBLIC_DJANGO_ADDRESS=$NEXT_PUBLIC_DJANGO_ADDRESS
ENV NEXT_PUBLIC_DJANGO_API_PATH=$NEXT_PUBLIC_DJANGO_API_PATH
ENV NEXT_PUBLIC_5_160_115_210_ADDRESS=$NEXT_PUBLIC_5_160_115_210_ADDRESS
ENV NEXT_PUBLIC_5_160_115_210_API_PATH=$NEXT_PUBLIC_5_160_115_210_API_PATH
ENV NEXT_PUBLIC_AUTHORIZATION_TOKEN_NAME=$NEXT_PUBLIC_AUTHORIZATION_TOKEN_NAME
ENV NEXT_PUBLIC_ACCESS_TOKEN_KEY=$NEXT_PUBLIC_ACCESS_TOKEN_KEY
ENV NEXT_PUBLIC_REFRESH_TOKEN_KEY=$NEXT_PUBLIC_REFRESH_TOKEN_KEY
ENV NEXT_PUBLIC_LOCALE_COOKIE_NAME=$NEXT_PUBLIC_LOCALE_COOKIE_NAME

# 7. Build the Next.js app
RUN npm run build

# 7. Production image, copy built assets and install only production dependencies
FROM node:20.9-alpine AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package.json ./
# COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"] 