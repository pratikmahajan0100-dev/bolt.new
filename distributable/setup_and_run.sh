#! /bin/bash

# Step 0: Install Docker if necessary
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin
# Step 1: Unzip and load the docker image
sudo gunzip -c bolt-new.tar.gz | sudo docker load
# Step 2: Run the app
sudo docker run --env-file .env.local -p 8080:8080 bolt-new
