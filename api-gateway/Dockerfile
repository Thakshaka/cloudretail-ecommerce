FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our configs
# Important: cors.include is NOT in conf.d to avoid being auto-included in http context
COPY default.conf /etc/nginx/conf.d/default.conf
COPY cors.include /etc/nginx/cors.include

EXPOSE 8000

CMD ["nginx", "-g", "daemon off;"]
