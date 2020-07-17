# set the node version with a build arg and parameterize your runtime
# without changing the file.
ARG NODE_VERSION=12.14.0

# start with alpine (a 5MB runtime), and add what we need
# note: if you need native deps, you'll have to do more work here.
FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

COPY . .

ENV PORT=80

EXPOSE 80

ENV NODE_ENV=production

CMD [ "npm", "start" ]
