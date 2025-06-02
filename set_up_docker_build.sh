#! /bin/bash
sudo docker build -t bolt-new -f Dockerfile.dev --no-cache .
sudo docker save bolt-new > distributable/bolt-new.tar
cd distributable
sudo gzip bolt-new.tar
