This container is supposed to help with debugging in multi-container environments.

Run it like this locally:
```
 docker run -it -p 8081:80  -e SERVICEENDPOINTHOST='172.17.0.1' -e SERVICEENDPOINTPATH='/api/whoareu' -e COLOR=red -e SERVICEENDPOINTPORT=
'8082'  danielmeixner/dbgcon
```

Point SERVICEENDPOINTHOST to a machine running a service on port SERVICEENDPOINTPORT under path SERVICEENDPOINTPATH. (e.g. on myserver:8080/myapi).

The container itself has the following sites/apis so you can easily run multiple containers to do some experiments:

/ --> shows some debug info
/ping --> responds with pong
/api/cascade --> calls SERVICEENDPOINTHOST:SERVICEENDPOINTPORT + SERVICEENDPOINTPATH

I recommend to provide also a COLOR. This will paint your screen when calling / and also serve as identifier for the container.

