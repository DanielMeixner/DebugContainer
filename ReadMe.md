This container is supposed to help with debugging in multi-container environments.

Run it like this locally on your dev PC or just run it on Azure as described [here](https://docs.microsoft.com/en-us/azure/app-service/containers/tutorial-multi-container-app) :
```
docker run -it -p 8082:80  -e SERVICEENDPOINTHOST=172.17.0.1 -e SERVICEENDPOINTPATH=/api/whoareu -e COLOR=red -e SERVICEENDPOINTPORT=8083  danielmeixner/dbgcon:2
docker run -it -p 8083:80  -e SERVICEENDPOINTHOST=172.17.0.1 -e SERVICEENDPOINTPATH=/api/ping -e COLOR=blue -e SERVICEENDPOINTPORT=8083 danielmeixner/dbgcon:2
```

This will start two containers where the first one points to the second one. If you call the first container in a browser it will show a link to the api of the second.

Point SERVICEENDPOINTHOST to a machine running a service on port SERVICEENDPOINTPORT under path SERVICEENDPOINTPATH. (e.g. on myserver:8080/myapi).
You may have to adjust the IP! On my machine this IP can be used to access containers from containers. Use *docker network inspect* to figure out your containers IPs.

The container itself has the following sites/apis so you can easily run multiple containers to do some experiments:

* / --> shows some debug info
* /ping --> responds with pong
* /api/cascade --> calls SERVICEENDPOINTHOST:SERVICEENDPOINTPORT + SERVICEENDPOINTPATH

I recommend to provide also a COLOR. This will paint your screen when calling / and also serve as identifier for the container.
aaaa
asdfasfssssaaasaaaaaaaaa
