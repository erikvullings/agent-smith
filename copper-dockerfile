FROM node:14-slim as builder
RUN npm install -g typescript @vue/cli
COPY /packages/copper-server /app/copper-server
WORKDIR /app/copper-server/
RUN yarn
RUN tsc
COPY /packages/copper-dashboard /app/copper-dashboard
WORKDIR /app/copper-dashboard/
RUN yarn
RUN yarn build

FROM mhart/alpine-node:14 as production-stage
COPY --from=builder /app/copper-server /app/copper-server
EXPOSE 3008
WORKDIR /app/copper-server
CMD ["node", "./dist/index.js"]
# CMD ["ls", "./dist"]
