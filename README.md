# tarsier

Tarsier is a 3d viewer for RDF knowledge bases. It is highly experimental! Tarsier has been developed by Fabio Viola @ University of Bologna.

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

The basic configuration file is named `tarsier.conf`. It looks like:

```
[server]
httpPort = 8080
host = localhost
localJSAP = tarsier.jsap
```
The local JSAP file is used to define all the queries used by Tarsier to retrieve and analyze the knowledge base.

## Using the client

Using the client is easy (and will be even easier in the future, I hope). Load a JSAP file (you may use `tarsier.jsap`). In the JSAP file you may specify the URIs of your endpoint and custom queries that you recall from the UI to filter the KB. Once the JSAP file is loaded, you can retrieve data with "Get Data" or "Get Data from SPARQL" (if you want to limit or customize the KB before drawing). Then click on "Plot!" and here you are the graph!
