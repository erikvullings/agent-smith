@echo off
setlocal
SET PWD=C:\dev\web\agent-smith\packages\osrm-services\data
SET FILE=netherlands-latest
echo Processing driving data

docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/%FILE%.osm.pbf
docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-partition /data/%FILE%.osrm
docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-customize /data/%FILE%.osrm

move data driving
mkdir data
move driving\%FILE%.osm.pbf data\

echo Processing bicycle data

docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-extract -p /opt/bicycle.lua /data/%FILE%.osm.pbf
docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-partition /data/%FILE%.osrm
docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-customize /data/%FILE%.osrm

move data cycling
mkdir data
move cycling\%FILE%.osm.pbf data\

echo Processing foot data

docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-extract -p /opt/foot.lua /data/%FILE%.osm.pbf
docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-partition /data/%FILE%.osrm
docker run -t -v "%PWD%:/data" osrm/osrm-backend osrm-customize /data/%FILE%.osrm

move data walking
mkdir data
move walking\%FILE%.osm.pbf data\

endlocal