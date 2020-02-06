const http = require('http');
const express = require('express');
const app = express();
const config = require('./config')
const request = require('request');
const rp = require('request-promise');


var htmlrequesticon = '<i class="fas fa-arrow-down"></i></br>';
var htmlusericon = '<i class="fas fa-user"></i></br>';

getClientAddress = function (req) {
    return req.connection.remoteAddress;
};


app.get('/static', (req, res) => {
    res.sendFile('static/static.html', { root: "." });
})

getHostIps = function () {
    var os = require('os');
    var nwinterface = os.networkInterfaces();
    var ips = [];
    Object.keys(nwinterface).forEach(function (nwinterfacename) {
        nwinterface[nwinterfacename].forEach(function (iface) {
            ips.push(iface.address);            
        });
    });
    return ips.toString();
}

// Routes
app.get('/ping', function (req, res) {
    console.log('received ping');
    res.send('Pong, Pong');
});

app.get('/api/whoareu', function (req, res) {
    var clientIP = getClientAddress(req);
    var addresses = getHostIps();
    if(req.query.sub==undefined)
    {
        // simple plain answer for debugging
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write("I'm ... " + config.color + " running on " + addresses);
    }
    else
    {
        // sophisticated HTML answer if
        // request comes from a cascading call and will be wrapped into html later by caller
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(createHTMLInfo(req.query.sub,"unknown",clientIP,htmlrequesticon));
    }    
    res.send();    
});

// calls next service as defined with env vars
app.get('/api/cascade', function (req, res) {
    var clientIP = getClientAddress(req);
    var url = "http://"+config.serviceendpointhost +":" +config.serviceendpointport  + config.serviceendpointpath;    

    // add query para "sub" for every subsequent query. This is used to indicate to the next called service to return a value in a useful format.
    // it is also used to indicate the position in the sequence of calls.
    var subpara = req.query.sub;
    var currentposition = undefined;
    if (subpara == undefined) {
        currentposition = 0;
    }
    else
    {
        currentposition = parseInt(subpara);
    }
    url = url + "?sub=" + (currentposition + 1);

    console.log("start cascading... " + url);

    console.log(req.headers);

    // call next service
    var o= {
    headers: {
        /* propagate the dev space routing header */
        'azds-route-as': req.headers['azds-route-as']
     }
    }

    rp.get(url,o)
        .then(function (data) {
            console.log("Data received from ... " +url);          
            
            // now create the answer.
            // first part of answer is info about this service
            var html = createHTMLInfo(currentposition, url, clientIP, htmlrequesticon);

            // pass on header for azds
            var azdsroute=req.headers['azds-route-as']; 

            if (currentposition > 0) {
                // contenttype will be defined by wrapping call
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                // second part of answer is the answer we got from the subsequent call - wrapped in a way that it doesn't break our html
                res.write(html + wrapdata(data));
            }
            else {
                // first call hits here

                // html head for presentation of results
                var htmlhead = "" +
                    "<html>" +
                    "<head>" +
                    "<style>" +
                    "canvas {float: left;width:100px;height:100px; }" +
                    'i {font-size:100px;}' +
                    "p.clear {clear: both; margin-left: 5px;}" +
                    'p.info {margin-left: 120px;}' +
                    "</style>" +
                    '<script src="https://kit.fontawesome.com/a076d05399.js"></script>' +
                    "</head>" +
                    "<body>" +
                    "<h1>Cascading API calls</h1>";                
                var htmlend = "</body></html>";
              
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(htmlhead + htmlusericon + html + wrapdata(data) + htmlend);
            }
            res.send();            
        });
});

// helper to provide fancy ui
function createHTMLInfo(currentposition, url, clientIP, htmlrequesticon) {
    var htmlcontent = "<p class=clear >";
    var canvas = '<canvas style="background-color:' + config.color + ';"></canvas>';
    var info = '<p class=info>' +
        'Color : ' + config.color + '</br>' +
        'Position : ' + currentposition + '</br>' +
        'IP: ' + getHostIps() + '</br>' +
        'Getting data from: ' + url + '</br>' +
        'Caller IP: ' + clientIP + '</br>' +
        
        '</p>';
    var htmlcontentend = '</p>';
    var html = htmlrequesticon + htmlcontent + canvas + info + htmlcontentend;
    return html;
}

function wrapdata(datastring)
{
    return '<p style="clear:both">'+datastring+'</p>';
}


app.get('/', function (req, res) {
    var clientIP = getClientAddress(req);
    var addresses = getHostIps();
    res.writeHead(200, { 'Content-Type': 'text/html' });

    tabs = "\t\t";

    res.end('<html><body bgcolor=' + config.color + '><h1>DebugContainer</h1>' +
        "<p>Make sure you started this container as described <a href=\"https://github.com/DanielMeixner/DebugContainer\">here</a>. </p>" +
        "<p>You can start this container multiple times locally. Make sure you provide your docker bridge gateway IP as SERVICEENDPOINTHOST.</p>" +

        "<p>Get <a href=\"/api/cascade\">/api/cascade</a> to query serviceendpoint1 + serviceendpointpath + serviceendpointport.</p>" +
        "SERVICEENDPOINTHOST=" + tabs + config.serviceendpointhost + "</br>" +
        "SERVICEENDPOINTPATH=" + tabs + config.serviceendpointpath + "</br>" +
        "SERVICEENDPOINTPORT=" + tabs + config.serviceendpointport + "</br>" +

        "Port=" + tabs + config.port + "</br>" +
        "Color=" + tabs + config.color + "</br>" +
        "ClientIP=" + tabs + clientIP + "</br>" +
        "ServerIP=" + tabs + addresses + "</br>" +
        "myvar=" + tabs + config.myvar + "</br>" +
        "bla=" + tabs + config.myvar + "</br>" +
        ""
    );
});

app.listen(config.port);
console.log("running & listening on " + config.port)

