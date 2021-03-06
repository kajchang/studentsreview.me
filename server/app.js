const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const bcrypt = require('bcrypt');
const fetch = require('isomorphic-fetch');

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
    production: { ssl: true, port: 80, hostname: 'api.studentsreview.me' },
    development: { ssl: false, port: 4000, hostname: 'localhost' }
};

const environment = process.env.NODE_ENV || 'production';
const config = configurations[environment];

async function scoreRecaptcha(token) {
    if (!token) return 0;
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${ process.env.RECAPTCHA_SECRET_KEY }&response=${ token }`, {
        method: 'post'
    });
    const result = await response.json();
    if (!result.success) return 0;
    return result.score;
}

function getScope(token) {
    if (!token) return 'USER';
    return bcrypt.compareSync(token, process.env.ADMIN_PWD_HASH) ? 'ADMIN' : 'USER';
}

const apollo = new ApolloServer({
    schema: GraphQLSchema,
    tracing: true,
    cacheControl: true,
    introspection: true,
    engine: {
        apiKey: process.env.ENGINE_API_KEY
    },
    cors: cors(),
    context: async integrationContext => ({
        remoteAddress: integrationContext.req.connection.remoteAddress,
        userAgent: integrationContext.req.headers['user-agent'],
        recaptchaScore: await scoreRecaptcha(integrationContext.req.headers.authorization),
        authScope: getScope(integrationContext.req.headers.authorization)
    })
});

const app = express();
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
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
            `https://${ config.hostname }:443${ apollo.graphqlPath }`
        )
    );
}

server = http.createServer(config.ssl ? (req, res) => {
    res.writeHead(301, { Location: 'https://' + req.headers['host'] + req.url });
    res.end();
} : app);

server.listen({ port: config.port }, () =>
    console.log(
        '🚀 HTTP Server ready at',
        `http://${ config.hostname }:${ config.port }${ apollo.graphqlPath }`
    )
);
