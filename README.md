# tarsier

Tarsier is a 3d viewer for RDF knowledge bases. It is highly experimental! Tarsier has been developed by Fabio Viola @ University of Bologna.

## Videos

Before trying Tarsier, have a look at these three videos!

[![Tarsier - local endpoint](https://img.youtube.com/vi/szA2W2awT1Y/1.jpg)](https://www.youtube.com/watch?v=szA2W2awT1Y) [![Tarsier - DBpedia](https://img.youtube.com/vi/OgoxFWAb1vQ/1.jpg)](https://www.youtube.com/watch?v=OgoxFWAb1vQ) [![Tarsier - reification](https://img.youtube.com/vi/DvWmItNzvKs/1.jpg)](https://youtu.be/DvWmItNzvKs)

## Getting started

First of all you need to clone the repository:

```bash
$ git clone http://github.com/desmovalvo/tarsier
```
Then, once you enter its directory, install the requirements with (mind the sharp symbol, meaning you have to be root):

```bash
# pip3 install -r requirements.txt
```

Now you're ready! Start the tarsier server with:

```bash
$ python3 tarsier.py
```
open your browser and go to `http://localhost:8080`

## Configuration of the server

The basic configuration file is contained in the `server_conf.yaml`. The local YAML file is used to define all the queries used by Tarsier to retrieve and analyze the knowledge base.

## Using the client

Using the client is easy (and will be even easier in the future, I hope). Load a YAML file (you may use `client_conf.yaml`). In the YAML file you may specify the URIs of your endpoint and custom queries that you recall from the UI to filter the KB. Once the YAML file is loaded, you can specify the initial knowledge base from the "SPARQL" box and retrieve data with "Get Data". Then click on "Plot!" and here you are the graph!
      
