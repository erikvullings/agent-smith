#!/bin/sh

WORKDIR="/Users/melissa/Desktop/tno_stage/agent-smith/docker/osrm-services/data"
FILE="netherlands-latest"
echo Processing driving data

docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua "/data/${FILE}.osm.pbf"
docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-partition "/data/${FILE}.osrm"
docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-customize "/data/${FILE}.osrm"

rmdir driving
mv data driving
mkdir data
mv "driving/${FILE}.osm.pbf" data/

echo Processing bicycle data

docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-extract -p /opt/bicycle.lua "/data/${FILE}.osm.pbf"
docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-partition "/data/${FILE}.osrm"
docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-customize "/data/${FILE}.osrm"

rmdir cycling
mv data cycling
mkdir data
mv "cycling/${FILE}.osm.pbf" data/

echo Processing foot data

docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-extract -p /opt/foot.lua "/data/${FILE}.osm.pbf"
docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-partition "/data/${FILE}.osrm"
docker run -t -v "${WORKDIR}:/data" osrm/osrm-backend osrm-customize "/data/${FILE}.osrm"

rmdir walking
mv data walking
mkdir data
mv "walking/${FILE}.osm.pbf" data/

echo Done
