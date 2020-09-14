# Agent-smith

An agent-based crowd simulator in 2D, loosely based on
[noncomputable/agentmaps](https://github.com/noncomputable/AgentMaps) by Andrew Gregory Tsesis. The main differences
are:

- This version is running as a server in Node.js, and it can be queried to return the agents' positions and state.
- It is written in TypeScript
- Building units are taken from OSM data, and not generated on-the-fly

Aim is to create a micro-simulator that simulates large groups of people and traffic as input for the evaluation of
threat scenarios. It does not aim to be a very realistic crowd or traffic simulator.

## Usage

Prerequisites: you need to have a working version of Docker running on your machine.

1. Setup OSRM, the Open Source routing machine. See the readme in `packages/osrm`. Note that you do not need to run it from there, as OSRM is started as part of the `docker-compose.yml` file in Kafka.
2. Start Kafka, see `packages/kafka`, for running the GUI.
3. Start Agent Smith Simulator, see `packages/ass`. You can use VSCode's launch file to run it.
4. Run `pnpm start` to also start the server/client needer for the simulation viewer

## Name

The name is inspired by Agent Smith in the film The Matrix.

## Simulation viewer

This project also includes a simulation viewer (named COPPER). This viewer consists of a server that listens to all simulation events published on Kafka and a webclient. After starting the viewer (point 4 of usage), visit [http://localhost:3008/](http://localhost:3008/) with your browser.

## Open Source Routing Machine

Used for creating a routing service for driving, cycling, and walking. These routing services are used by the agents to
compute their routes. Please see `packages/osrm` how to set it up.

See their [website](https://project-osrm.org).

## OpenTripPlanner

See the [website](https://opentripplanner.org).

## TODO

Below is a description of the goals we are working towards...

## Scalability

### Multi-core and distributed servers

The basic idea is that the main service has knowledge about all agent-smith simulator services (ASS services), and that
it can split the map and share it between all simulators. Each ASS will also receive a list of all map boundaries, and a
high-level road network, so routing is possible from the local map to another map. When an agent leaves an ASS, it will
deregister with the current ASS and register with the new ASS via TCP/IP.

### Grouping

An agent can also have children: these children will either have a fixed relative position to the parent agent, e.g. to
simulate people in a bus, or a dynamic relative position, e.g. to simulate people walking in a group. Nesting is limited
to 2 levels, so we can also simulate a family group walking inside a tour group. Agents can leave or join a group when
needed.

## Creating vector tiles

On an Ubuntu machine, run the following commands:

```bash
git clone https://github.com/openmaptiles/openmaptiles.git
cd openmaptiles
sudo ./quickstart.sh netherlands # assuming you want to create mbtiles from The Netherlands (replace with the name known at geofabrik).

```
