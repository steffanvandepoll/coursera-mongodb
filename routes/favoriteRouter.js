const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const Favorites = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    const filter = {"user": req.user._id};
    Favorites.findOne(filter)
    .populate(['user', 'dishes'])
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const filter = {"user": req.user._id};
    Favorites.findOneAndUpdate(filter, {}, {new: true, upsert: true})
    .then((favorite) => {
        console.log("got here");
        console.log(favorite);
        favorite.user = req.user._id;
        req.body.map(dish => {
            //only add dishes not in the list
            if(favorite.dishes.indexOf(dish._id) < 0){
                console.log('adding a dish to the favorite list');
                favorite.dishes.push(dish._id)
            }
        });
        favorite.save()
        .then((favorite) => {
            Favorites.findById(favorite._id)
            .populate(['user', 'dishes'])
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })            
        }, (err) => next(err));
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const filter = {"user": req.user._id};
    Favorites.remove(filter)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/'+ req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const filter = {"user": req.user._id};
    Favorites.findOneAndUpdate(filter, {}, {new: true, upsert: true})
    .then((favorite) => {
        favorite.user = req.user._id;
        //check if dish already exists, if not we push it
        if(favorite.dishes.indexOf(req.params.dishId) < 0){
            favorite.dishes.push(req.params.dishId)
        }
        favorite.save()
        .then((favorite) => {
            Favorites.findById(favorite._id)
            .populate(['user', 'dishes'])
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })            
        }, (err) => next(err));
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/'+ req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const filter = {"user": req.user._id};
    Favorites.findOne(filter)
    .then((favorite) => {
        //filter dishes
        favorite.dishes = favorite.dishes.filter(dish => !dish._id.equals(req.params.dishId));
        favorite.save()
        .then((favorite) => {
            Favorites.findById(favorite._id)
            .populate(['user', 'dishes'])
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })            
        }, (err) => next(err));
    }, (err) => next(err))
    .catch((err) => next(err));    
});

module.exports = favoriteRouter;