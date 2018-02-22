#!/usr/bin/python3

# global reqs
import os
import pdb
import sys
import time
import uuid
import queue
import logging
import threading
import tornado.web
import configparser
import tornado.ioloop
from sepy.JSAPObject import *
from sepy.LowLevelKP import *
from tornado.httpserver import *
from rdflib import Graph, URIRef, BNode, Literal
from tornado.options import define, options, parse_command_line

# local reqs

########################################################################
#
# HTTP Handler
#
########################################################################

class HTTPHandler(tornado.web.RequestHandler):

    def get(self):

        # debug
        logging.debug("HTTPHandler::get")

        # store 
        self.render("index.html", requestUri=myConf["requestURI"])

        
    def post(self):

        # parse the request
        msg = json.loads(self.request.body)
        logging.info("Received request: %s" % msg["command"])

        # generate a session UUID
        sessionID = str(uuid.uuid4())

        # create a graph
        graphs[sessionID] = Graph()
        
        # do the stuff
        if msg["command"] == "info":

            # 1 - do the construct                
            if "sparql" in msg:                                
                status, results = kp.query(msg["queryURI"], msg["sparql"])
                logging.info(results)
            else:
                status, results = kp.query(msg["queryURI"], "SELECT ?s ?p ?o WHERE { ?s ?p ?o }")
                logging.info(results)
                
            # 2 - put data into a local graph
            for r in results["results"]["bindings"]:
                
                # 2.1 - build the triple
                s = URIRef(r["subject"]["value"])
                p = URIRef(r["predicate"]["value"])                    
                if r["object"]["type"] == "uri":
                    o = URIRef(r["object"]["value"])
                else:
                    o = Literal(r["object"]["value"])
                graphs[sessionID].add((s,p,o))
                            
            # initialize results
            f_results = {}
            f_results["instances"] = {}
            f_results["properties"] = {}
            f_results["properties"]["datatype"] = []
            f_results["properties"]["object"] = []
            f_results["pvalues"] = {}
            f_results["pvalues"]["datatype"] = {}
            f_results["pvalues"]["object"] = {}
            f_results["classes"] = []

            # get all the instances
            logging.info("Getting instances")
            status, results = kp.query(msg["queryURI"], jsap.getQuery("ALL_INSTANCES", {}))
            for r in results["results"]["bindings"]:
                key = r["instance"]["value"]
                if not key in f_results["instances"]:
                    f_results["instances"][key] = {}                
            
            # get all the data properties
            logging.info("Getting data properties")
            status, results = kp.query(msg["queryURI"], jsap.getQuery("DATA_PROPERTIES", {}))
            print(results)
            print(type(results))
            for r in results["results"]["bindings"]:
                key = r["p"]["value"]
                f_results["properties"]["datatype"].append(key)

            # get all the data properties and their values
            logging.info("Getting data properties values")
            status, results = kp.query(msg["queryURI"], jsap.getQuery("DATA_PROPERTIES_AND_VALUES", {}))
            results2 = graphs[sessionID].query(jsap.getQuery("DATA_PROPERTIES_AND_VALUES", {}))

            logging.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@") 
            logging.info(results2)
            for row in results2:
                logging.info(row)
            logging.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@") 
            
            for r in results["results"]["bindings"]:
                key = r["p"]["value"]
                if not(key in f_results["pvalues"]["datatype"]):
                    f_results["pvalues"]["datatype"][key] = []

                # bind the property to the proper structure
                f_results["pvalues"]["datatype"][key].append({"s":r["s"]["value"], "o":r["o"]["value"]})

                # also bind the property to the individual
                newkey = r["s"]["value"]
                if not(newkey in f_results["instances"]):
                    f_results["instances"][newkey] = {}
                f_results["instances"][newkey][key] = r["o"]["value"]
                
            # get all the object properties
            logging.info("Getting object properties")
            status, results = kp.query(msg["queryURI"], jsap.getQuery("OBJECT_PROPERTIES", {}))
            for r in results["results"]["bindings"]:
                key = r["p"]["value"]
                f_results["properties"]["object"].append(key)

            # get all the object properties and their values
            logging.info("Getting object properties values")
            status, results = kp.query(msg["queryURI"], jsap.getQuery("OBJECT_PROPERTIES_AND_VALUES", {}))
            for r in results["results"]["bindings"]:
                key = r["p"]["value"]
                if not(key in f_results["pvalues"]["object"]):
                    f_results["pvalues"]["object"][key] = []
                f_results["pvalues"]["object"][key].append({"s":r["s"]["value"], "o":r["o"]["value"]})
                                
            # get the list of classes
            logging.info("Getting classes")
            status, results = kp.query(msg["queryURI"], jsap.getQuery("ALL_CLASSES", {}))
            for r in results["results"]["bindings"]:
                key = r["class"]["value"]
                f_results["classes"].append(key)

            # done
            logging.info("Done!")
                
            # send the reply
            self.write(f_results)
    
        elif msg["command"] == "sparql":

            # debug
            logging.info(self.request)
            logging.info(msg)
            
            # do the query            
            status, results = kp.query(msg["queryURI"], msg["sparql"])
            logging.info(results)
            self.write(results)
            

########################################################################
#
# HTTP Thread
#
########################################################################

class HTTPThread(threading.Thread):

    # constructor
    def __init__(self, port, n):
        self.port = port
        self.n = n
        logging.debug("Initializing thread " + self.n)
        threading.Thread.__init__(self)

    # the main loop
    def run(self):
        logging.debug("Running thread " + self.n)

        # define routes
        settings = {"static_path": os.path.join(os.getcwd(), "static"),
                    "template_path": os.path.join(os.getcwd(), "templates")}
        application = tornado.web.Application([
            (r"/", HTTPHandler),
            (r"/commands", HTTPHandler),            
            (r"/favicon.ico", tornado.web.StaticFileHandler, {"path": "./static/"}),            
        ], **settings)

        # start the main loop
        application.listen(8080)
        logging.debug('Starting main loop for thread ' + self.n)
        logging.debug('Starting server ' + self.n + ' on port ' + str(self.port))
        ioloop = tornado.ioloop.IOLoop()
        ioloop.current().start()    
        
########################################################################
#
# main
#
########################################################################

if __name__ == '__main__':

    # init
    httpServerUri = None
    jsap = None
    graphs = {}
    
    # logging configuration
    logger = logging.getLogger("Tarsier")
    logging.basicConfig(format='[%(levelname)s] %(message)s', level=logging.DEBUG)
    logging.debug("Logging subsystem initialized")

    # read config file
    myConf = {}
    config = configparser.ConfigParser()
    logging.debug("Parsing Configuration file")
    config.read('tarsier.conf')

    # read config file -- section 'server'
    try:
        myConf["httpPort"] = config.getint('server', 'httpPort')
        myConf["host"] = config.get('server', 'host')
        myConf["requestURI"] = "http://%s:%s/commands" % (myConf["host"], myConf["httpPort"])
        myConf["jsap"] = config.get('server', 'localJSAP')
    except configparser.NoSectionError:
        logging.critical("Missing section 'server' in config file")
        sys.exit(255)
    except configparser.NoOptionError:
        logging.critical("Section 'server' must include keys 'httpPort' and 'host'")
        sys.exit(255)

    # create a JSAPObject and a KP
    jsap = JSAPObject(myConf["jsap"])
    kp = LowLevelKP()
        
    # http interface
    threadHTTP = HTTPThread(myConf["httpPort"], "HTTP Interface")

    # Start new Threads
    threadHTTP.start()

