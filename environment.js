var yaml = require("js-yaml");
var path = require("path");
var fs = require("fs");
var cfenv = require("cfenv");

console.log("environment.exports() : process.env", process.env);

var environment = {};

// Recursively searches through the sourceEnvironment and copies all env
// properties to the targetEnvironment if they do not already exist.
// Note: Only does a shallow copy of env properties.
var copyEnvironment = function(sourceEnvironment, targetEnvironment, copy)
{
    for (var property in sourceEnvironment)
    {
        if (sourceEnvironment.hasOwnProperty(property))
        {
            var value = sourceEnvironment[property];

            if (copy)
            {
                if (!targetEnvironment.hasOwnProperty(property))
                {
                    targetEnvironment[property] = value;
                }
            }
            else if (property == "env")
            {
                copyEnvironment(value, targetEnvironment, true);
            }
            else if ((value != null) && (typeof value === "object"))
            {
                copyEnvironment(value, targetEnvironment, false);
            }
        }
    }
};

environment.localhost = (process.env.VCAP_APPLICATION != null) ? false : true;

if (environment.localhost)
{
    console.log("environment.exports() : localhost");

    // Load all of the env properties from the manifest files...
    var directory = "";
    var file = (process.env.MANIFEST || "manifest.yml");
    while (file != null)
    {
        contents = yaml.load(fs.readFileSync(file));
        copyEnvironment(contents, environment, false);

        if (contents.inherit != null)
        {
            directory = path.dirname(file);
            file = directory + "/" + contents.inherit;
        }
        else
        {
            file = null;
        }
    }

    environment.VCAP_APP_PORT = 3002;
    environment.VCAP_APP_HOST = "0.0.0.0";

    environment.VCAP_APPLICATION = {};

    environment.VCAP_SERVICES = { "user-provided": [ { "credentials": {} } ]};
}
else
{
    console.log("environment.exports() : VCAP_APPLICATION");

    environment.appEnv = cfenv.getAppEnv();

    copyEnvironment(process.env, environment, true);

    environment.VCAP_APP_PORT = environment.appEnv.port;
    environment.VCAP_APP_HOST = environment.appEnv.bind;
    environment.VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION);
    environment.VCAP_SERVICES    = JSON.parse(process.env.VCAP_SERVICES);
}

console.log("environment.exports() : environment", environment);

module.exports = environment;
