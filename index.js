const fs = require('fs');
const express = require("express");
const session = require('express-session')
const app = express();
const { join } = require('path');
const path = require("path");
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient } = require('mongodb');
const url = process.env.linkDB;
const sessionID = process.env.session
const client = new MongoClient(url);
const dbName = 'NotasOnline';

app.use(session({
    secret: sessionID,
    resave: true,
    saveUninitialized: true
}))

app.use(express.static(join(__dirname + '/public')));
app.set("views", path.join(__dirname + "/public/views"));
app.engine('html', require('ejs').renderFile);
app.set("view engine", "html");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
    if(req.session.email) {
        async function main() {
        await client.connect();
        console.log('Acessando banco de dados...');
        const db = client.db(dbName);

        const collection2 = db.collection('Notas');
        var dbArray = await collection2.find({ "usuario.email": req.session.email, "usuario.password": req.session.password }).toArray();
        var notas = new Array();
        var cont = 0;

        while(cont<dbArray.length) {
            var obj = {
                "notename": dbArray[cont].name,
                "id": dbArray[cont].id,
                "usuario": {
                    "email":  req.session.email,
                    "password":  req.session.password
                }
            }
            notas.unshift(obj);
            cont++;
        }
        res.render("listnotes", { notas: notas });

        return 'Saindo do banco de dados...';
    }

    main()
		.then(console.log)
		.catch(console.error)
		.finally(() => client.close());
    } else {
        if(req.session.erro) {
            req.session.erro = null;
            res.render("index", {erro: true});
        } else {
            res.render("index", {erro: null});
        }
    }
})

app.post("/", function(req, res) {
    async function main() {
        await client.connect();
        console.log('Acessando banco de dados...');
        const db = client.db(dbName);
        var collection = db.collection('Usuarios');
        var dbArray = await collection.find({ "registro.email": req.body.email, "registro.password": req.body.password }).toArray();
        if(dbArray.length == 1) {
            req.session.email = req.body.email;
            req.session.password = req.body.password;
            res.redirect("/");
        } else {
            req.session.erro = true;
            res.redirect("/");
        }

        return 'Saindo do banco de dados...';
    }

    main()
		.then(console.log)
		.catch(console.error)
		.finally(() => client.close());
})

app.get("/registro", function (req, res) {
    if(req.session.erro) {
        req.session.erro = null;
        res.render("registro", {erro: true});
    } else {
        res.render("registro", {erro: null})
    }
})

app.post("/registro", function(req, res) {
    async function main() {
        await client.connect();
        console.log('Acessando banco de dados...');
        const db = client.db(dbName);
        const collection = db.collection('Usuarios');

        var dbArray = await collection.find({ "registro.email": req.body.email }).toArray();
        if(dbArray.length == 0) {
            var registro = {
                email: req.body.email,
                password: req.body.password
            }
            await collection.insertOne({registro});
            req.session.email = req.body.email;
            req.session.password = req.body.password;
            res.redirect("/");
        } else {
            req.session.erro = true;
            res.redirect("/registro");
        }

        return 'Saindo do banco de dados...';
    }

    main()
		.then(console.log)
		.catch(console.error)
		.finally(() => client.close());
})

app.get("/notes/", function(req, res) {
    if(req.session.email) {
        var noteid = req.query.id;
        async function main() {
            await client.connect();
            console.log('Acessando banco de dados...');
            const db = client.db(dbName);
            const collection = db.collection('Notas');
    
            var dbArray = await collection.find({ "usuario.email": req.session.email, "usuario.password": req.session.password, "id": noteid }).toArray();
            if(dbArray.length == 1) {
                var obj = {
                    "notename": dbArray[0].name,
                    "link": dbArray[0].link,
                    "id": dbArray[0].id,
                    "usuario": {
                        "email": req.body.email,
                        "password": req.body.password
                    },
                    "conteudo": dbArray[0].conteudo
                }
        
                res.render("nota", { nota: obj })
            } else {
                res.redirect("/")
            }
            return 'Saindo do banco de dados...';
        }
    
        main()
            .then(console.log)
            .catch(console.error)
            .finally(() => client.close());
    } else {
        res.redirect("/");
    }
})

app.get("/newnote", function(req, res) {
    if(req.session.email) {
        res.render("insert");
    } else {
        res.redirect("/")
    }
})

app.post("/insert", function(req, res) {
    if(req.session.email) {
        async function main() {
            await client.connect();
            console.log('Acessando banco de dados...');
            const db = client.db(dbName);
            const collection = db.collection('Notas');
    
            var dbArray = await collection.find({}).toArray();
            var id = dbArray.length+1;
            var id = id.toString();
            var registro = {
                name: req.body.notename,
                conteudo: req.body.content,
                id: id,
                usuario: {
                    email: req.session.email,
                    password: req.session.password
                }
            }
            await collection.insertOne(registro);
            res.redirect("/");
    
            return 'Saindo do banco de dados...';
        }
    
        main()
            .then(console.log)
            .catch(console.error)
            .finally(() => client.close());
    }
})

app.get("/sitemap.xml", function (req, res) {
    res.sendFile(path.join(__dirname) + "/sitemap.xml");
})

app.listen(3000, function() {
    console.log("http://localhost:3000");
})
