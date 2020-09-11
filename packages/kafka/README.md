# Background services

In order for the agent simulation to communicate with other simulators or for displaying the agents on, for example, a
map, the information needs to be shared. Apache Kafka is used to share this information, so the agent simulator will
push agent updates.

## Usage

To start OSRM, Apache Kafka and other services, you need to install Docker and Docker-compose, and provide the correct paths in the `.env` file for the OSRM filename and data folder (see also the OSRM package folder). Next, you can run the whole stack using:

```bash
docker-compose up -d
```

To stop, just use

```bash
docker-compose down
```

## Services

- [Kafka topics UI](http://localhost:3600/#/)
- [Kafka schema registry UI](http://localhost:3601/#/)
- [Time service](http://localhost:8100/): In the (almost hidden) menu at the top left, the simulation time can be set.
- Kafka broker: http://localhost:3501
- Schema registry: http://localhost:3502
