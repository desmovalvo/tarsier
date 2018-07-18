#!/usr/bin/python3

# reqs
import pdb
import json
import requests
import traceback

def doQuery(endpoint, q):

    # read input
    uri = endpoint["url"]
    query = endpoint["queryPrefix"]    
    headers = endpoint["httpHeaders"]
    verb = endpoint["httpVerb"]

    # manipulate input query
    try:
        finalQuery = json.loads(endpoint["queryPrefix"])
        finalQuery["query"] = q
    except:
        print(traceback.print_exc())
        finalQuery = endpoint["queryPrefix"] % q
    
    # manipulate input headers
    try:
        finalHeaders = json.loads(headers)
    except:
        finalHeaders = headers
        
    # HTTP POST
    if verb == "POST":
        try:
            print(uri)
            print(type(finalQuery))
            print(headers)
            r = requests.post(uri, data = finalQuery, headers = finalHeaders)
        except:
            return False, None

    # HTTP GET
    else:
        try:
            r = requests.get(uri, data = query, headers = headers)
        except:
            return False, None

    # return
    try:
        res = json.loads(r.text)
        return True, res
    except:
        return False, None
