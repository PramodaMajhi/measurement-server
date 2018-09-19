$(aws ecr get-login --no-include-email --region us-west-2)
docker build -t measurement-server .
docker tag measurement-server:latest 467141366916.dkr.ecr.us-west-2.amazonaws.com/measurement-server:latest
docker push 467141366916.dkr.ecr.us-west-2.amazonaws.com/measurement-server:latest
