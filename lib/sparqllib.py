#!/usr/bin/python3

# reqs
import json
import requests

def doQuery(endpoint, q):

    # read input
    uri = endpoint["url"]
    query = endpoint["queryPrefix"] % q
    headers = endpoint["httpHeaders"]
    verb = endpoint["httpVerb"]

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
        r = requests.post(uri, data = finalQuery, headers = finalHeaders)
        print(r.status_code)
        print(r.text)

    # HTTP GET
    else:
        r = requests.get(uri, data = query, headers = headers)

    # return
    res = json.loads(r.text)
    return res
