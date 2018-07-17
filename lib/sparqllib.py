#!/usr/bin/python3

# reqs
import pdb
import json
import requests

def doQuery(endpoint, q):

    # read input
    uri = endpoint["url"]
    query = endpoint["queryPrefix"] % q    
    headers = endpoint["httpHeaders"]
    verb = endpoint["httpVerb"]

    # sanitize query
    query = query.replace("\n", " ")
    
    # manipulate input query
    try:
        finalQuery = json.loads(query)
    except:
        finalQuery = query
        
    # manipulate input headers
    try:
        finalHeaders = json.loads(headers)
    except:
        finalHeaders = headers
        
    # HTTP POST
    if verb == "POST":
        try:
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
