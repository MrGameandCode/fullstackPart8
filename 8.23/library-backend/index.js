//Just as we have learn on chapter 3, we will use dotenv instead of hardcoding the mongo environment.
//We could also use cross-env, but for the shake of simplicity, we will just use 1 environment.
//The properties stored in the .env file are "MONGODB_URI", "SECRET", "PORT" and "JWT_SECRET"
require("dotenv").config();
const { ApolloServer } = require("@apollo/server");
const mongoose = require("mongoose");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const resolvers = require("./resolvers");
const typeDefs = require("./schema");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");

console.log("connecting to", process.env.MONGODB_URI);
const JWT_SECRET = process.env.JWT_SECRET;

mongoose
  .set("strictQuery", false)
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB:", error.message);
  });

// setup is now within a function
const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({ server: httpServer, path: "/" });
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null;
        if (auth && auth.startsWith("Bearer ")) {
          const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
          const currentUser = await User.findById(decodedToken.id).populate();
          return { currentUser };
        }
      },
    })
  );

  const PORT = process.env.PORT;

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`)
  );
};

start();
