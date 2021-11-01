# start with alpine (a 5MB runtime), and add what we need
# note: if you need native deps, you'll have to do more work here.
FROM 286985534438.dkr.ecr.us-east-1.amazonaws.com/node:12.14.0-alpine

WORKDIR /usr/src/app

COPY . .

ENV PORT=80

EXPOSE 80

CMD [ "npm", "start" ]
