@echo off
setlocal
SET PWD=C:\dev\web\agent-smith\packages\osrm-services\
SET FILE=netherlands-latest
echo Starting route services

docker run --name driving -t -i -d -p 5000:5000 -v "%PWD%driving:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/%FILE%.osrm
docker run --name cycling -t -i -d -p 5001:5000 -v "%PWD%cycling:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/%FILE%.osrm
docker run --name walking -t -i -d -p 5002:5000 -v "%PWD%walking:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/%FILE%.osrm

endlocal