# WE NEED TO USE AN OFFICIAL NODE.JS IMAGE
FROM node:20

# Create app directory inside the docker container
WORKDIR /usr/src/app

# Install all the dependencies requires for this website from the package-lock.json file belonging to the project.
COPY package*.json ./
RUN npm install

# Copy all the files inside the directory this file is in and move them to the container
COPY . .

# Expose the port of the server.
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]