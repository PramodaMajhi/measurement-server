if [[ "$PWD" != */measurement-server ]]
then
  echo "please run from measurement-server directory"
  exit
fi

echo "building client..."
cd client
npm run build
cd ..
echo "done"

echo "copying client build to server..."
rm -rf ./server/build  
cp -r ./client/build ./server
echo "done"

echo "logging into AWS repository server..."
$(aws ecr get-login --no-include-email --region us-west-2)
echo "done"

echo "building server Docker image"
cd server
docker build -t measurement-server .
cd ..
echo "done"

echo "tagging and pushing to AWS repository"
docker tag measurement-server:latest 627272263172.dkr.ecr.us-west-2.amazonaws.com/measurement-server:latest
docker push 627272263172.dkr.ecr.us-west-2.amazonaws.com/measurement-server
echo "done"