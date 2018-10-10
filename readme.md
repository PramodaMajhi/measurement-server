# Build instructions

## Ensure you have the AWS CLI installed

```sh
$ aws --version
aws-cli/1.16.16 Python/3.6.6 Darwin/17.7.0 botocore/1.12.6
```
If not, follow the instructions [here](https://docs.aws.amazon.com/cli/latest/userguide/installing.html)

## Configure your AWS credentials

To do that, follow the instructions [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)


## Build

The following script:
1. Does a production build of the client
2. Copies the client build to the server directory
3. Logs into the AWS repository server
3. Builds a Docker image of the server
4. Tags and pushes the docker image to the AWS repository server

```sh
$ ./scripts/build-all-and-push.sh

building client...
[...]
done
copying client build to server...
done
logging into AWS repository server...
[...]
Login Succeeded
done
building server Docker image
[...]
Successfully tagged measurement-server:latest
done
tagging and pushing to AWS repository
[...]
latest: digest: sha256: [...] size: [...]
done
```
## Deloy to AWS
1. login to https://aws.amazon.com/console/
2. Enter account ID#
3. IM user name
4. password
5. click on sign in
6. Change  to US-West (Oregon)
6. Click on elastic container services
7. then Click on Cluster 
8. Default >
9. custom-service
10. Update
11. Do not forget to check "Force new Deployment"
12. then "Next steps" then Update
13. Wait for a minute to primary became running count to 1
14. Launch the app using URL:  http://ec2co-ecsel-1btpzrrnkdqrn-1571469319.us-west-2.elb.amazonaws.com/ 
