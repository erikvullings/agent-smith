# Battlelab Dashboard

## Introductie

<uitleg>

## Bouwblokken

<uitleg opbouw en gebruikte libraries>
https://vuejs.org

https://vuetifyjs.com/en

https://github.com/TNOCS/csnext


## Installatie

Voor het compileren en ontwikkelen aan het dashboard wordt gebruik gemaakt van NodeJS (https://nodejs.org/en/). Dat kan via NPM of via Yarn. In deze handleiding maken we gebruik van Yarn. Deze kan je eventueel installeren via

```
npm install yarn -g
```

De volgende stap is het uitchecken van de code en het installeren van de benodige requirements:


```
git clone https://ci.tno.nl/gitlab/sgbo/dd-risico-dashboard.git
cd dd-risico-dashboard
yarn
```

## Ontwikkelen 

Voor het ontwikkelen kan je gebruik maken van 

```
yarn serve
``` 

De applicatie wordt gestart en automatisch gecompileerd en herladen na elke opgeslagen wijziging. Meestal op de volgende URL.

http://localhost:8080

## Distributie

Wil je de applicatie klaar maken voor gebruik kan je gebruik maken van de build script om een distributie folder te maken (./dist).

``` 
yarn build
````

Een andere mogelijkheid om de applicatie te draaien is middels een docker container. De volgende stappen helpen je een docker container te maken en te draaien


```
$ docker build -t sgbo/dd-risico-dashboard .                                # Build docker image  
$ docker run -it --name dashboard sgbo/dd-risico-dashboard -p 8080:8080     # Run docker container
```

De docker applicatie start de applicatie en maakt deze beschikbaar op:

http://localhost:8080

De docker build is ook uit te voeren met een yarn commando:
```
yarn docker:build
```

## License

Copyright (c) 2018

Licensed under the [MIT license](LICENSE).
