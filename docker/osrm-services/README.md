# OSRM Background service

For the routing, the agents need a service that informs than how to progress along the road network. The OSRM (Open
Source Routing Machine) provides this service, for driving, cycling and walking. These are actually 3 services, all
derived from a locally stored (in the data folder) OSM pbf file.

## Setting up the OSRM services

Assuming you have installed Docker, proceed as follows.

- From [GeoFabrik](https://www.geofabrik.de/), download the latest OSM file and save it in the `data` folder.
- Update the `preprocess.bat` file to reflect the local GIT folder that you are using, i.e. provide the proper name for
  the `PWD` and `FILE` properties. Run `preprocess.bat`. For The Netherlands, processing all 3 profiles (driving,
  cycling and walking), it takes less than an hour. The first time, it may take slightly more since you also need to
  download the docker images.

## Starting the OSRM services

You can either start it using a docker command, as is done in the `launch.bat` file:

- Update the `launch.bat` file and set the `PWD` and `FILE` properties. Beware the trailing slash in the `PWD` property.
- Run `launch.bat`.

Alternatively, you can use the docker-compose file:

- Update the `.env` file specifying the corrects folder path and file name. You can use `docker-compose config` to verify that the path and filename are correctly specified.
- Run `docker-compose up -d`
