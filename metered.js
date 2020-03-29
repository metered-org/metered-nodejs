'use strict';
const net = require('net');
const https = require('https')
const http = require('http')
var VERSION = '0.3.0';

var Config = function(config){
    var _this = this;
    this.config = config||{};
    _this.config.host = config.host||'';
    _this.config.port = config.port ? config.port : 443;
    if(this.config.tcp){
	this.config.hostPort = {host: this.config.host, port: this.config.port};
    }
};

Config.prototype.Https = function(options, body, cb){
    options.port = 443;
    return this.Http(options, body, cb);
};

Config.prototype.Http = function(options, params, cb){

    var h = options.port == 443 ? https : http;

    const req = h.request(options, (res) => {
	res.on('data', (d) => {
	    cb(null, d.toString(), res);
	});
	res.on('error', (err) => {
	    cb(err);
	});
    });
    
    req.on('error', (err) => {
	//POST error
	cb(err);
    });

    if (params){
	req.write(params);
    }

    req.end();
};

Config.prototype.Post = function(params, cb){
    var _this = this;
    if(!_this.config.host){
	cb({success:false, error: {message:"bad host"}});
	return;
    }
    if(!_this.config.apikey){
	cb({success:false, error: {message:"bad apikey"}});
	return;
    }
    var body = JSON.stringify(params);

    const options = {
	hostname: _this.config.host,
	port: _this.config.port||443,
	path: (_this.config.path||'/') +'api/metered/'+VERSION+'/webhooks/validate',
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json',
	    'Content-Length': body.length,
	    'apikey':_this.config.apikey
	}
    };
    _this.Http(options, body, cb);
};

var Usage = {};
Usage.Increment = (_this) => {
    return function(req,res,next){
	var obj = {
	    route: req.route.path,
	    query: req.query,
	    body: req.body,
	    params: req.params,
	    url: req.url,
	    method: req.method,
	    quantity:1,
	    metered: req.metered,
	    event:'validate'
	};
	var objStr = JSON.stringify(obj);
	next();
	return;
    };
};

var Auth = {};
Auth.Validate = (_this, collect, options) => {
    return function(req,res,next){
	var m = {};
	for(var prop in collect){
	    var fn = collect[prop];
	    m[prop] = fn(req,res,next);
	};
	m.config = _this.config;

	if (typeof options != "undefined"){
	    if(options.increment){
		m.increment = true;
	    }
	}
	Auth.RemoteValidate(req,res,next,_this,m);
	return;
    };
};

Auth.Increment = (_this, collect) => {
    return Auth.Validate(_this, collect, {increment:true});
}

Auth.RemoteValidate = function(req,res,next,_this,m){
    if (m.config.apikey.length && (m.customer || m['subscription'] )){
	//http
	_this.Post(m, function(err, data, resp){
	    if (!err){
		if (resp.statusCode == 200){
		    req.metered = {};
		    req.metered.request = m;
		    req.metered.response = JSON.parse(data);
		    next();
		}else{
		    next(resp);
		}
	    }
	});
    }else{
	    next('Unauthorized');
    }
};

var Params = {};
Params.ByParam = (param) => {
    return function(req,res,next){
	return req.params[param];
    }
};
Params.ByHeader = (param) => {
    return function(req,res,next){
	return req.header(param);
    }
};
Params.ByUrl = (param) => {
    return function(req,res,next){
	return req.url;
    }
};
Params.ByQuery = (param) => {
    return function(req,res,next){
	return req.query(param);
    }
};
Params.ByBody = (param) => {
    return function(req,res,next){
	return req.body(param);
    }
};

/*Params.ByParam = (_this,param) => {
    return function(req,res,next){
	return Params.Validate(req, res, next, _this, req.params[param])
    }
};

Params.ByBody = (_this,param) => {
    return function(req,res,next){
	return Params.Validate(req, res, next, _this, req.body[param])
    }
};

Params.ByQuery = (_this,param) => {
    return function(req,res,next){
	return Params.Validate(req, res, next, _this, req.query[param])
    }
};

Params.ByHeader = (_this,param) => {
    return function(req,res,next){
	return Params.Validate(req, res, next, _this, req.headers[param])
    }
};
*/
module.exports = {
    Config: Config,
    Auth: Auth,
    Usage: Usage,
    Params: Params
};
