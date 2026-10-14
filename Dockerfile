# SACHIZU LAB on Fly.io: the public app's static build (npm run build:fly, base '/') served by nginx (fly.toml).
# No compressed copies: Fly's proxy in front compresses text and WebAssembly itself (gzip, br) and nginx sends proxied
# requests as they are (gzip_proxied off; the proxy adds Via), so copies made here were never sent (2026-10-14) and
# only made the image 14 MB larger.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist-fly /usr/share/nginx/html
