var config = {}
config.port = process.env.MYPORT || 80;
config.color =  process.env.COLOR;
config.serviceendpointhost = process.env.SERVICEENDPOINTHOST;
config.serviceendpointpath = process.env.SERVICEENDPOINTPATH;
config.serviceendpointport = process.env.SERVICEENDPOINTPORT;
config.myvar = process.env.MYVAR;
config.protocol = process.env.PROTOCOL || "http";
console.log(process.env);
config.disableAppInsights = process.env.DISABLEAPPINSIGHTS || 0;
module.exports = config;