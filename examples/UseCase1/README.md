# Instructions

This folder contains a Notation3 file (`kb.n3`) hosting a sample knowledge base and a yaml file (`useCase1.yaml`) used to configure Tarsier client. A possible endpoint is proposed in the yaml file: [Blazegraph](https://www.blazegraph.com/).

## How to run blazegraph on localhost

Blazegraph can be downloaded from [here](https://www.blazegraph.com/download/) and, then run with:

```
java -server -Xmx4g -jar blazegraph.jar
```

## How to load the knowledge base

The n3 file can loaded into Blazegraph from their web interface available on localhost, port 9999.