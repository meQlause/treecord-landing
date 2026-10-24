# The landing is a static site: build it with Node, serve the files with nginx. Cloud Run sends traffic to $PORT.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: the husky git hooks have nothing to do in an image build
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
# the nginx image fills ${PORT} into this template when the container starts
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV PORT=8080
EXPOSE 8080
