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
        finalQuery = json.loads(query)["query"]
    except:
        finalQuery = query
    print(query)
        
    # manipulate input headers
    try:
        finalHeaders = json.loads(headers)
    except:
        finalHeaders = headers
        
    # HTTP POST
    if verb == "POST":
        print("POST")
        print(finalQuery)
        print(finalHeaders)
        r = requests.post(uri, data = finalQuery, headers = finalHeaders)
        print(r.status_code)
        print(r.text)

    # HTTP GET
    else:
        print("GET")
        r = requests.get(uri, data = query, headers = headers)

    # return
    try:
        res = json.loads(r.text)
    except:
        return None
    return res
