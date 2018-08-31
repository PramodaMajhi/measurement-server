docker build -t measurement-server .
docker tag measurement-server 627272263172.dkr.ecr.us-east-1.amazonaws.com/measurement-server
docker push 627272263172.dkr.ecr.us-east-1.amazonaws.com/measurement-server
