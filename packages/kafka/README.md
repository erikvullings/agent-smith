# Background services

In order for the agent simulation to communicate with other simulators or for displaying the agents on, for example, a
map, the information needs to be shared. Apache Kafka is used to share this information, so the agent simulator will
push agent updates.

## Usage

To start Apache Kafka and other services, you need to install Docker and Docker-compose, after which you can run:

```bash
docker-compose up -d
```

To stop, just use

```bash
docker-compose down
```

### Note

In the near future, it is likely that the OSRM services will become part of this too.

## Services

- [Kafka topics UI](http://localhost:3600/#/)
- [Kafka schema registry UI](http://localhost:3601/#/)
- [Time service](http://localhost:8100/): In the (almost hidden) menu at the top left, the simulation time can be set.
- Kafka broker: http://localhost:3501
- Schema registry: http://localhost:3502
