# Places App Backend

## Requirements

An environment that supports Node.JS and MongoDB and a .env in the root app directory with the following options:

```
# Required for database interaction
MONGODB_CONNECTION_STRING="mongodb://some_mongo_host:port/database?options"

# Required for Maps and Geocoding API calls
GOOGLE_API_KEY="some_API_Key"

# Required for generating tokens
TOKEN_SECRET="SuperSecretSecret"

# Optional, defaults to "1h"
TOKEN_EXPIRY="1h"

# Optional, defaults to uploads/images
IMAGES_DIR="uploads/images"

# Optional, CORS origins to allow, defaults to "*"
CORS_ORIGIN="*"

# Optional, defaults to 5000 if not specified
LISTEN_PORT=5000
```

## Installation

### Base Installation

Configure your MongoDB server, and then install like any NPM app with:

`npm install`

Once the node_modules directory is populated and you have created a .env file as described in [Requirements](#requirements), you can start the development server with:

`npm run`

### Docker

There are two options for Docker installations:

#### Docker-Compose

Requires Docker and the Docker-Compose tool, create your .env file and then execute:

`docker-compose up`

#### Devcontainer

Requires a supported tool like Visual Studio Code, IntelliJ Idea, Dev Container CLI. Instructions vary per tool, but the devcontainer definition files live in the .devcontainer folder.

Do note that the devcontainer forwards ports 5000 (default LISTEN_PORT for backend server) and port 27017 (default MongoDB port) so you may need to change if your environment is different.
