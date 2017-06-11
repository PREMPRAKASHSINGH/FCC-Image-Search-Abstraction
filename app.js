var express = require('express');
var mongo = require('mongoskin');
var request = require('request');
var bodyParser = require('body-parser')
var app = express();

PORT = process.env.PORT || 8000;
var ClientId = process.env.ClientId
var db = mongo.db(process.env.MONGOLAB_URI,{native_parser:true});


app.use(function(req,res,next){
	req.db = db;
	next();
})

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/",function(req,res){
	res.sendFile("./index.html"));
})

app.get("/search/:query",function(req,res){
	var db = req.db;
	var q= req.params.query;
	var page= (req.query.offset!=undefined && req.query.offset!=null) ? req.query.offset : 1;
	var url = `https://api.imgur.com/3/gallery/search/${q}?page=${page}`;
	//search for image
	var options = { 
				method: 'GET',
			  url: url,
			  qs: { q: q },
			  headers: { 'content-type': 'application/json',authorization: `Client-ID ${ClientId}` }
			};

	request(options, function (err, response, body) {
	  if (err) throw new Error(err);
	  else{
	  	var body = JSON.parse(response.body);
	  	var array = body.data.map(function(item){
	  		return {
	  			img_url:item.link,
	  			alt_text: item.title,
	  			context: `https://imgur.com/${item.id}`
	  		};
	  	})
	  	var obj = {
	  		data: array,
	  		time: Date.now()
	  	};
	  	db.collection('image_search').insertOne(obj,function(err,data){
	  		if(err){
	  			res.json({Status:0,msg:"Some Error occured."});
	  			console.log("Some Error occured as "+err);
	  		}else{
			  	res.send(obj);
	  		}
	  	})
	  }
	});
})

app.get("/latest",function(req,res){
	var db = req.db;
	db.collection('image_search').find({},{_id:0}).sort({time: 1}).toArray(function(err,data){
		if(err){
	  			res.json({Status:0,msg:"Some Error occured."});
	  		}else{
			  	res.send(data);
	  		}
	});
})

//requests done
//404 errors
app.use(function(req,res){
    res.send("404 not found.");
});

app.listen(PORT,function () {
	console.log("listening on port 8000")
})
