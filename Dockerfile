# SACHIZU LAB on Fly.io: the public app's static build (npm run build:fly, base '/') served by nginx (fly.toml).
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist-fly /usr/share/nginx/html
