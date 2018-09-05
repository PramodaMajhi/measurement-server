if [[ "$PWD" = */measurement-server ]]; then
	rm -rf ./server/build  
  cp -r ./client/build ./server
else
  echo "please run from measurement-server directory"
fi

