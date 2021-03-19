'use strict';

const { LogLevel } = require("@opentelemetry/core");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { SimpleSpanProcessor, ConsoleSpanExporter } = require("@opentelemetry/tracing");




const { ZipkinExporter } = require("@opentelemetry/exporter-zipkin");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");

const provider = new NodeTracerProvider({
  logLevel: 1
});

provider.register();

provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new ZipkinExporter({
      serviceName: "getting-started",
      // If you are running your tracing backend on another host,
      // you can point to it using the `url` parameter of the
      // exporter config.
      
    })
  )
);

console.log("tracing initialized");




const provider2 = new NodeTracerProvider();
provider2.register();

registerInstrumentations({
  instrumentations: [
    {
      plugins: {
        express: {
          enabled: true,
          // You may use a package name or absolute path to the file.
          path: '@opentelemetry/plugin-express',
        }
      }
    },
  ],
  tracerProvider: provider2,
});

console.log("done");