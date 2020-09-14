@echo off
setlocal
echo Stopping route services

docker stop driving
docker rm driving 
docker stop cycling
docker rm cycling
docker stop walking
docker rm walking

endlocal