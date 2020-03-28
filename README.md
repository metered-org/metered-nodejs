## metered

Helps SaaS businesses and API developers with metered billing, validating API usage to your API, tracking usage, and syncing with your Stripe dashboard.

### Features

* Configure where to find the API key / customer / product
* Mention the product name or Configure which part of the url/query/body/post/url indicates a product
* Validate API keys of all requests that a customer sends, through a middleware
* Increase usage records
* No dependencies
* Fine grained control of when to increase usage
* Light weight. Soon to support TCP,UDP apart from HTTP
* Contact [Metered](mailto:api@metered.org) for an API key to automatically create Customer, Subscriptions, Plans, And Usage Records based on how your customers are hitting your API, into your Stripe Dashboard

### Usage

#### Eg 1: Example of directly recording customer's use of your API

Here we also capture version, and decide the entire url will be the product

	const Metered = require('metered');

	meter = new Metered.Config({
	    apikey:'YOUR_API_KEY'                                 // Do not share
	});
	
	app.post('/alien/wire', (req,res) => {

			meter.customer = 'alien-bank';                    // Set customer
			meter.subscription = 'inter-galactic-transfer';   // Set subscription
			
			// At this point we know your customer 
			// has sent a valid API key
			res.send({success: true, 
			          message:'Done. Thanks.'                 // Your logic
			});               
		
			
			//increase usage by 1 for the given customer, product
			Metered.Usage.Increment	(meter)                   // Increase Usage
	 	}
	});	
	    
#### Eg 2: Getting usage validated and recorded, before your logic

Here we also capture version, and decide the entire url will be the product

	const Metered = require('metered');

	meter = new Metered.Config({
	    apikey:'YOUR_API_KEY'                                 // Do not share
	});
	
	app.get('/api/vision/detect/:confidence', 
	
		// This is a middleware
		// Here we validate and increment if validated 
		// even before your logic
		Metered.Auth.Increment(meter,{
			 apikey   : Metered.Params.ByHeader('x-apikey'),  // Validate api-key
	    	 product  : Metered.Params.ByUrl(),               // product = full path
	    	 version  : Metered.Params.ByParam('version')     // Also capture version
	    	                                                  // & then Increment
		}),
	
		(req,res,next) => {
			// At this point we know your customer 
			// has sent a valid API key
			res.send({message:'Your new Balance is ',
						bal: req.metered.response.balance     // End, display balance
			});             
			
	 	}
	});
	
#### Eg 3: First validating, using balance to your logic, and then incrementing usage by 2% of filesize of a download

Here is a more detailed example that has 


	const Metered = require('metered');

	meter = new Metered.Config({
	    apikey:'YOUR_API_KEY'                                 // Do not share
	});
	
	app.get('/download/:product', 
	
		// We can ask the meter to parse out params
		// from the url, query, body, url or a header
		Metered.Auth.Validate(meter,{
			 apikey   : Metered.Params.ByHeader('apikey'),    // Validate api-key
	    	 product  : Metered.Params.ByParam('product')     // Parse product
		}),
	
			(req,res,next) => {
			var product = req.params.product;
	
			// At this point we know your customer 
			// has sent a valid API key
			if (allGood){
				myRedirectTo(req.params.product);             // Your logic

				// Store a custom variable in the same request 
				req.fileSizeLogic = myTwoPercentLogic(req.body);
		
				// and call next middleware to be used there
				next();                                       // Continue to usage
			}else{
				// passing an argument to next indicates an error
				next('That file does not exist');             // Stops if !allGood
			}
	 	},

		// we seperately call middleware Metered.Usage.Increment
		// since we called Metered.Auth.Validate
		// which would not have incremented earlier
		// So now we increment usage by 2% of the file size
		Metered.Usage.Increment	By({
			amount: fileSizeLogic*0.02,                       // Complex Usage
			currency: 'usd'
		});

	});

### Upcoming Features
* Choice of TCP/UDP/HTTP protcol
	    
### Who do I talk to? ###

* Raise an issue or feature request
