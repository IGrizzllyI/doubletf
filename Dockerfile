FROM node:argon

RUN npm install -g bower
RUN npm install -g gulp

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY bower.json /usr/src/app/
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /usr/src/app/
RUN npm install mysql

# Bundle app source
COPY . /usr/src/app

# Run gulp after copying everything over
RUN bower install -f --allow-root
RUN gulp dist

EXPOSE 8080

CMD [ "npm", "start" ]
