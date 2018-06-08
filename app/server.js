// require('dotenv-extended').load();
const http = require('http');
const express = require('express');
const app = express();
const config = require('./config')
const request = require('request');


getClientAddress = function (req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0]
        || req.connection.remoteAddress;
};


getHostIps = function () {
    var os = require('os');
    var ifaces = os.networkInterfaces();
    var ips = "";
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
                ips += iface.address;
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
                ips += iface.address;
            }
            ++alias;
        });
    });
    return ips;


}

// Routes
app.get('/ping', function (req, res) {
    console.log('received ping');
    res.send('Pong');
});

app.get('/api/whoareu', function (req, res) {
    var clientIP = getClientAddress(req);
    var addresses = getHostIps();
    res.send("I'm ... " + config.color + " running on " + addresses);
});

app.get('/api/cascade', function (req, res) {
    console.log("start cascading... " + config.serviceendpointhost + ":" + config.serviceendpointport + config.serviceendpointpath)


    var clientIP = getClientAddress(req);
    http.get(
        {
            host: config.serviceendpointhost,
            path: config.serviceendpointpath,
            port: config.serviceendpointport
        },
        (resp) => {
            let data = '';
            console.log("Getting data ... " + config.serviceendpointhost + " " + config.serviceendpointpath + " " + config.serviceendpointport);
            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                console.log("data came in... ");
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log("request done ... ");
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                console.log(data);
                res.write(config.serviceendpointhost + " answered with ... \n\t\t\t\t | \n\t\t\t\t | \n\t\t\t\t |  \n\t\t\t\t v \n" + data);
                res.send();
                console.log("Done");
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
});

app.get('/', function (req, res) {
    var clientIP = getClientAddress(req);
    var addresses = getHostIps();
    res.writeHead(200, { 'Content-Type': 'text/html' });

    tabs = "\t\t";

    res.end('<html><body bgcolor='+ config.color + '><h1>DebugContainer</h1>' +
        "<p>Make sure you started this container as described <a href=\"https://github.com/DanielMeixner/DebugContainer\">here</a>. </p>" +
        "<p>You can start this container multiple times locally. Make sure you provide your docker bridge gateway IP as SERVICEENDPOINTHOST.</p>"+
        
        "<p>Get <a href=\"/api/cascade\">/api/cascade</a> to query serviceendpoint1 + serviceendpointpath + serviceendpointport.</p>" +
        "SERVICEENDPOINTHOST=" + tabs + config.serviceendpointhost + "</br>" +
        "SERVICEENDPOINTPATH=" + tabs + config.serviceendpointpath + "</br>" +
        "SERVICEENDPOINTPORT=" + tabs + config.serviceendpointport + "</br>" +
        
        "Port=" + tabs + config.port + "</br>" +
        "Color=" + tabs + config.color + "</br>" +
        "ClientIP=" + tabs + clientIP + "</br>" +
        "ServerIP=" + tabs + addresses + "</br>" +
        "myvar=" + tabs + config.myvar + "</br>" +
        
        
        ""
    );
});
app.listen(config.port);
console.log("running & listening on " + config.port)
//console.log(`Running on http://${HOST}:${PORT}`);
