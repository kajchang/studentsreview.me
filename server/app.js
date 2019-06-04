const fs = require('fs');
const https = require('https');
const http = require('http');

const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');

const express = require('express');
const mongoose = require('mongoose');

const GraphQLSchema = require('./graphql/schema');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/StudentsReview';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
    .then(() => {
        console.log('Connected to MongoDB!');
    })
    .catch((err) => {
        console.log(err);
    });

const configurations = {
    production: { ssl: true, hostname: 'api.studentsreview.me' },
    development: { ssl: false, hostname: 'localhost' }
};

const environment = process.env.NODE_ENV || 'production';
const config = configurations[environment];

const apollo = new ApolloServer({
    schema: GraphQLSchema,
    tracing: true,
    cacheControl: true,
    engine: {
        apiKey: process.env.ENGINE_API_KEY
    },
    cors: cors()
});

const app = express();
apollo.applyMiddleware({
    app,
    path: '/'
});

let server;
if (config.ssl) {
    const https_server = https.createServer(
        {
            key: fs.readFileSync('/etc/letsencrypt/live/api.studentsreview.me/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/api.studentsreview.me/fullchain.pem')
        },
        app
    );

    https_server.listen({ port: 443 }, () =>
        console.log(
            '🚀 HTTPS server ready at',
            `https://${config.hostname}:${config.port}${apollo.graphqlPath}`
        )
    );
}

server = http.createServer(app);
apollo.installSubscriptionHandlers(server);

server.listen({ port: 80 }, () =>
    console.log(
        '🚀 HTTP Server ready at',
        `http://${config.hostname}:${config.port}${apollo.graphqlPath}`
    )
);
