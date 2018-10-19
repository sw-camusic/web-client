FROM node:8-alpine
RUN npm install -g @angular/cli
CMD ["tail", "-f", "/dev/null"]
