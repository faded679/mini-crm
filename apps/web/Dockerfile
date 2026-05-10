FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ARG VITE_IS_DEMO=false
ENV VITE_IS_DEMO=$VITE_IS_DEMO
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
