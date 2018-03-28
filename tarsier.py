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

            # initialize results
            f_results = {}
            f_results["instances"] = {}
            f_results["resources"] = {}
            f_results["bnodes"] = {}
            f_results["properties"] = {}
            f_results["properties"]["datatype"] = []
            f_results["properties"]["object"] = []
            f_results["pvalues"] = {}
            f_results["pvalues"]["datatype"] = {}
            f_results["pvalues"]["object"] = {}
            f_results["classes"] = []
            f_results["literals"] = []
            f_results["sessionID"] = sessionID
            
            # 1 - do the construct                
            if "sparql" in msg:                                
                status, results = kp.query(msg["queryURI"], msg["sparql"])
                logging.info(results)
            else:
                status, results = kp.query(msg["queryURI"], "SELECT ?subject ?predicate ?object WHERE { ?subject ?predicate ?object }")
                logging.info(results)
                
            # 2 - put data into a local graph
            logging.info(results)
            for r in results["results"]["bindings"]:

                # 2.1 - build the triple

                # subject
                s = None
                l = None
                try:
                    l = str(r["subject"]["value"])
                    if r["subject"]["type"] == "uri":                
                        s = URIRef(l)
                    else:
                        s = BNode(l)
                        if not str(l) in f_results["bnodes"]:
                            f_results["bnodes"][str(l)] = {}
                            f_results["bnodes"][str(l)]["statements"] = {}
                except:
                    l = str(r["s"]["value"])
                    if r["s"]["type"] == "uri":                        
                        s = URIRef(l)
                    else:
                        s = BNode(r["s"]["value"])
                        if not str(l) in f_results["bnodes"]:
                            f_results["bnodes"][str(l)] = {}
                            f_results["bnodes"][str(l)]["statements"] = {}

                # predicate
                p = None
                l = None
                try:
                    l = str(r["predicate"]["value"])
                    p = URIRef(l)
                except:
                    l = str(r["p"]["value"])
                    p = URIRef(l)

                # object
                o = None
                l = None
                try:
                    l = str(r["object"]["value"])
                    if r["object"]["type"] == "uri":                
                        o = URIRef(l)
                    elif r["object"]["type"] == "bnode":                
                        o = BNode(l)
                        if not str(l) in f_results["bnodes"]:
                            f_results["bnodes"][str(l)] = {}
                            f_results["bnodes"][str(l)]["statements"] = {}
                    else:
                        o = Literal(l)
                        if not l in f_results["literals"]:
                            f_results["literals"].append(l)
                except:
                    l = str(r["o"]["value"])
                    if r["o"]["type"] == "uri":                
                        o = URIRef(l)
                    elif r["o"]["type"] == "bnode":                
                        o = BNode(l)
                        if not str(l) in f_results["bnodes"]:
                            f_results["bnodes"][str(l)]["statements"] = {}
                    else:
                        o = Literal(l)
                        if not l in f_results["literals"]:
                            f_results["literals"].append(l)
                        
                logging.info("Adding triple %s, %s, %s" % (s,p,o))
                graphs[sessionID].add((s,p,o))
                
            # get all the resources
            logging.info("Getting resources")
            results = graphs[sessionID].query(jsap.getQuery("ALL_RESOURCES", {}))
            for row in results:
                key = str(row["res"])
                if not key in f_results["resources"]:
                    f_results["resources"][key] = {}
                    f_results["resources"][key]["drawAsRes"] = True
                    f_results["resources"][key]["statements"] = {}
                
            # get all the instances
            logging.info("Getting instances")
            results = graphs[sessionID].query(jsap.getQuery("ALL_INSTANCES", {}))
            for row in results:
                key = row["instance"]
                if not key in f_results["instances"]:
                    f_results["instances"][key] = {}                

            # get all the data properties
            logging.info("Getting data properties")
            results = graphs[sessionID].query(jsap.getQuery("DATA_PROPERTIES", {}))
            for r in results:
                key = str(r["p"])
                f_results["properties"]["datatype"].append(key)
                f_results["resources"][key]["drawAsRes"] = False

            # get all the data properties and their values
            logging.info("Getting data properties values")
            results = graphs[sessionID].query(jsap.getQuery("DATA_PROPERTIES_AND_VALUES", {}))
            for row in results:

                key = str(row["p"])
                if not(key in f_results["pvalues"]["datatype"]):
                    f_results["pvalues"]["datatype"][key] = []

                # bind the property to the proper structure
                f_results["pvalues"]["datatype"][key].append({"s":row["s"], "o":row["o"]})

                # also bind the property to the individual
                newkey = str(row["s"])
                print("ROW 186 -- " + newkey)
                print(f_results["resources"])
                if newkey in f_results["resources"]:                
                    if not key in f_results["resources"][newkey]["statements"]:
                        f_results["resources"][newkey]["statements"][key] = []                        
                    f_results["resources"][newkey]["statements"][key].append(row["o"])
                if newkey in f_results["bnodes"]:
                    if not key in f_results["bnodes"][newkey]["statements"]:
                        f_results["bnodes"][newkey]["statements"][key] = []
                    f_results["bnodes"][newkey]["statements"][key].append(row["o"])
             
            # get all the object properties
            logging.info("Getting object properties")
            results = graphs[sessionID].query(jsap.getQuery("OBJECT_PROPERTIES", {}))
            for row in results:
                key = str(row["p"])
                f_results["properties"]["object"].append(key)
                f_results["resources"][key]["drawAsRes"] = False

            # get all the object properties and their values
            logging.info("Getting object properties values")
            results = graphs[sessionID].query(jsap.getQuery("OBJECT_PROPERTIES_AND_VALUES", {}))
            for row in results:
                key = row["p"]
                if not(key in f_results["pvalues"]["object"]):
                    f_results["pvalues"]["object"][key] = []
                f_results["pvalues"]["object"][key].append({"s":row["s"], "o":row["o"]})

                # new data struct
                #full["uris"][str(key)]["isOP"] = True
                                
            # get the list of classes
            logging.info("Getting classes")
            logging.info(jsap.getQuery("ALL_CLASSES", {}))
            results = graphs[sessionID].query(jsap.getQuery("ALL_CLASSES", {}))
            for row in results:
                key = str(row["class"])
                f_results["classes"].append(key)
                f_results["resources"][key]["drawAsRes"] = False
            
            # done
            logging.info("Done!")

            # update statistics
            f_results["individuals_num"] = 0
            for res in f_results["resources"]:
                if f_results["resources"][res]["drawAsRes"]:
                    f_results["individuals_num"] += 1
            
            # send the reply
            self.write(f_results)
    
        elif msg["command"] == "sparql":

            # debug
            logging.info(self.request)
            logging.info(msg["sparql"])
            # do the query            
            results = graphs[msg["sessionID"]].query(msg["sparql"])

            # build the results dictionary
            res_dict = {}
            res_dict["head"] = {}
            res_dict["results"] = {}
            res_dict["head"]["vars"] = []
            res_dict["results"]["bindings"] = []        
            for v in results.vars:
                res_dict["head"]["vars"].append(str(v))
            for row in results:
                d = {}
                for v in res_dict["head"]["vars"]:
                    try:
                        d[v] = {}
                        if isinstance(row[v], URIRef):
                            d[v]["type"] = "uri"
                        elif isinstance(row[v], BNode):
                            d[v]["type"] = "bnode"
                        else:
                            d[v]["type"] = "literal"
                        d[v]["value"] = str(row[v])
                    except KeyError:
                        pass
                    res_dict["results"]["bindings"].append(d)
            logging.info(res_dict)
                      
            self.write(res_dict)
            

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

