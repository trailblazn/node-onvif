/* ------------------------------------------------------------------
* node-onvif - service-media.js
*
* Copyright (c) 2016 - 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-08-26
* ---------------------------------------------------------------- */
'use strict';
const mUrl    = require('url');
const mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
* Constructor: OnvifServiceMedia(params)
* - params:
*    - xaddr   : URL of the entry point for the media service
*                (Required)
*    - user  : User name (Optional)
*    - pass  : Password (Optional)
*    - time_diff: ms
* ---------------------------------------------------------------- */
function OnvifServiceMedia(params) {
	this.xaddr = '';
	this.user = '';
	this.pass = '';

	let err_msg = '';

	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		throw new Error('The value of "params" was invalid: ' + err_msg);
	}

	if('xaddr' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['xaddr'], 'string')) {
			throw new Error('The "xaddr" property was invalid: ' + err_msg);
		} else {
			this.xaddr = params['xaddr'];
		}
	} else {
		throw new Error('The "xaddr" property is required.');
	}

	if('user' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['user'], 'string', true)) {
			throw new Error('The "user" property was invalid: ' + err_msg);
		} else {
			this.user = params['user'] || '';
		}
	}

	if('pass' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['pass'], 'string', true)) {
			throw new Error('The "pass" property was invalid: ' + err_msg);
		} else {
			this.pass = params['pass'] || '';
		}
	}

	this.oxaddr = mUrl.parse(this.xaddr);
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	}

	this.time_diff = params['time_diff'];
	this.name_space_attr_list = [
		'xmlns:trt="http://www.onvif.org/ver10/media/wsdl"',
		'xmlns:tt="http://www.onvif.org/ver10/schema"'
	];
};

OnvifServiceMedia.prototype._createRequestSoap = function(body) {
	let soap = mOnvifSoap.createRequestSoap({
		'body': body,
		'xmlns': this.name_space_attr_list,
		'diff': this.time_diff,
		'user': this.user,
		'pass': this.pass
	});
	return soap;
};

/* ------------------------------------------------------------------
* Method: setAuth(user, pass)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.setAuth = function(user, pass) {
	this.user = user || '';
	this.pass = pass || '';
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	} else {
		this.oxaddr.auth = '';
	}
};

/* ------------------------------------------------------------------
* Method: getStreamUri(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the profile
*   - Protocol     | String | required | "UDP", "HTTP", or "RTSP"
*
* {
*   'ProfileToken': 'Profile1,
*   'Protocol'    : 'UDP'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getStreamUri = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Protocol'], 'string')) {
			reject(new Error('The "Protocol" property was invalid: ' + err_msg));
			return;
		} else if(!params['Protocol'].match(/^(UDP|HTTP|RTSP)$/)) {
			reject(new Error('The "Protocol" property was invalid: The value must be either "UDP", "HTTP", or "RTSP".'));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetStreamUri>';
		soap_body +=   '<trt:StreamSetup>';
		soap_body +=     '<tt:Stream>RTP-Unicast</tt:Stream>';
		soap_body +=     '<tt:Transport>';
		soap_body +=       '<tt:Protocol>' + params['Protocol'] + '</tt:Protocol>';
		soap_body +=     '</tt:Transport>';
		soap_body +=   '</trt:StreamSetup>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:GetStreamUri>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetStreamUri', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getVideoEncoderConfigurations([callback])
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoEncoderConfigurations = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '';
		soap_body += '<trt:GetVideoEncoderConfigurations />';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoEncoderConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getVideoEncoderConfiguration(params[, callback])
* - params:
*   - ConfigurationToken | String | required | a token of the configuration
*
* {
*   'ConfigurationToken': 'Configuration1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoEncoderConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetVideoEncoderConfiguration>';
		soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:GetVideoEncoderConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoEncoderConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: addVideoEncoderConfiguration(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the profile
*   - ConfigurationToken | String | required | a token of the configuration
*
* {
*   'ProfileToken': 'Profile1',
*   'ConfigurationToken': 'Configuration1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addVideoEncoderConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:AddVideoEncoderConfiguration>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:AddVideoEncoderConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'AddVideoEncoderConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: setVideoEncoderConfiguration(params[, callback])
* - params:
*   - ConfigurationToken | String | required | a token of the configuration
*   - ConfigurationName | String | required | a name for the configuration
*   - UseCount | Integer | required | an integer for the use count
*   - Encoding | String | required | video codec, either JPEG, H264 or MPEG4
*   - Resolution | Object | required | contains resolution width and height properties
*      - Resolution.Width | Integer | required | number of the columns of the video image
*      - Resolution.Height | Integer | required | number of the lines of the video image
*   - Quality | Integer | required | value for the video quantizers and the quality of the video
*   - RateControl | Object | optional | contains rate control properties
*      - FrameRateLimit | Integer | required | maximum output framerate in fps. if an encodinginterval is provided the resulting encoded framerate will be reduced by the given factor
*      - EncodingInterval | Integer | required | an integer for the encoding interval
*      - BitrateLimit | Integer | required | an integer for the bitrate limit
*   - H264 | Object | optional | contains H264 properties
*      - GovLength | Integer | required | Group of Video frames length
*      - H264Profile | String | required |  H.264 profile, either baseline, main, extended or high
*   - Mpeg4 | Object | optional | contains Mpeg4 properties
*      - GovLength | Integer | required | Group of Video frames length
*      - Mpeg4Profile | String | required |  Mpeg4 profile, either simple profile (SP) or advanced simple profile (ASP)
*   - Multicast | Object | required | multicast settings that could be used for video streaming
*      - Address | Object | required | contains multicast address properties
*         - Type | String | required | multicast address protocal type
*         - IPv4Address | String | required | multicast address (if this address is set to 0 no multicast streaming is enaled)
*      - Port | Integer | required | RTP mutlicast destination port. A device may support RTCP. In this case the port value shall be even to allow the corresponding RTCP stream to be mapped to the next higher (odd) destination port number as defined in the RTSP specification
*      - TTL | Integer | required |TTL value for the multicast stream
*      - AutoStart | boolean | required | true if the streaming is persistant (shall restart after a reboot)
*   - SessionTimeout | String | required | RTSP session timeout for the related video stream
*
* {
*   'ConfigurationToken': 'Configuration1',
*   'ConfigurationName': 'VideoEncoder1',
*   'UseCount': 1,
*   'Encoding': 'H264',
*   'Resolution': {
*      'Width': 1920,
*      'Height': 1080
*   },
*   'Quality': 5
*   'RateControl': {
*      'FrameRateLimit': 10,
*      'EncodingInterval': 120,
*      'BitrateLimit': 3072,
*   },
*   'H264': {
*      'GovLength': 32,
*      'H264Profile': 'Main'
*   },
*   'Mpeg4': {
*      'GovLength': 32,
*      'Mpeg4Profile': 'SP'
*   },
*   'Multicast': {
*      'Address': {
*         'Type': 'IPv4',
*         'IPv4Address': '239.255.0.0'	// or IPv6Address depending on type
*      },
*      'Port': 1024,
*      'TTL': 3,
*      'AutoStart': false,
*   },
*   'SessionTimeout': 'PT60S'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.setVideoEncoderConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationName'], 'string')) {
			reject(new Error('The "ConfigurationName" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['UseCount'], 'integer')) {
			reject(new Error('The "UseCount" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Encoding'], 'string')) {
			reject(new Error('The "Encoding" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Resolution'], 'object')) {
			reject(new Error('The "Resolution" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Resolution']['Width'], 'integer')) {
			reject(new Error('The "Resolution.Width" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Resolution']['Height'], 'integer')) {
			reject(new Error('The "Resolution.Height" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Quality'], 'integer')) {
			reject(new Error('The "Quality" property was invalid: ' + err_msg));
			return;
		}

		if (params['RateControl']) {

			if(err_msg = mOnvifSoap.isInvalidValue(params['RateControl'], 'object')) {
				reject(new Error('The "RateControl" property was invalid: ' + err_msg));
				return;
			}

			if(err_msg = mOnvifSoap.isInvalidValue(params['RateControl']['FrameRateLimit'], 'integer')) {
				reject(new Error('The "RateControl.FrameRateLimit" property was invalid: ' + err_msg));
				return;
			}

			if(err_msg = mOnvifSoap.isInvalidValue(params['RateControl']['EncodingInterval'], 'integer')) {
				reject(new Error('The "RateControl.EncodingInterval" property was invalid: ' + err_msg));
				return;
			}

			if(err_msg = mOnvifSoap.isInvalidValue(params['RateControl']['BitrateLimit'], 'integer')) {
				reject(new Error('The "RateControl.BitrateLimit" property was invalid: ' + err_msg));
				return;
			}
		}

		if (params['H264']) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['H264'], 'object')) {
				reject(new Error('The "H264" property was invalid: ' + err_msg));
				return;
			}

			if(err_msg = mOnvifSoap.isInvalidValue(params['H264']['GovLength'], 'integer')) {
				reject(new Error('The "H264.GovLength" property was invalid: ' + err_msg));
				return;
			}

			if(err_msg = mOnvifSoap.isInvalidValue(params['H264']['H264Profile'], 'string')) {
				reject(new Error('The "H264.H264Profile" property was invalid: ' + err_msg));
				return;
			}
		}

		if (params['Mpeg4']) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['Mpeg4'], 'object')) {
				reject(new Error('The "Mpeg4" property was invalid: ' + err_msg));
				return;
			}

			if(err_msg = mOnvifSoap.isInvalidValue(params['Mpeg4']['GovLength'], 'integer')) {
				reject(new Error('The "Mpeg4.GovLength" property was invalid: ' + err_msg));
				return;
			}

			if(err_msg = mOnvifSoap.isInvalidValue(params['Mpeg4']['Mpeg4Profile'], 'string')) {
				reject(new Error('The "Mpeg4.Mpeg4Profile" property was invalid: ' + err_msg));
				return;
			}
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Multicast'], 'object')) {
			reject(new Error('The "Multicast" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Multicast']['Address'], 'object')) {
			reject(new Error('The "Multicast.Address" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Multicast']['Address']['Type'], 'string')) {
			reject(new Error('The "Multicast.Address.Type" property was invalid: ' + err_msg));
			return;
		}
		const MulticastIPType = params['Multicast']['Address']['Type'];

		if(err_msg = mOnvifSoap.isInvalidValue(params['Multicast']['Address'][MulticastIPType+'Address'], 'string')) {
			reject(new Error('The "Multicast.Address.'+MulticastIPType+'Address" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Multicast']['Port'], 'integer')) {
			reject(new Error('The "Multicast.Port" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Multicast']['TTL'], 'integer')) {
			reject(new Error('The "Multicast.TTL" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Multicast']['AutoStart'], 'boolean')) {
			reject(new Error('The "Multicast.AutoStart" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['SessionTimeout'], 'string')) {
			reject(new Error('The "SessionTimeout" property was invalid: ' + err_msg));
			return;
		}
		let soap_body = '';
		soap_body += '<trt:SetVideoEncoderConfiguration>';
		soap_body += '<trt:Configuration token="' + params['ConfigurationToken'] + '">';
		// Name
	    soap_body +=    '<tt:Name>' + params['ConfigurationName'] + '</tt:Name>';
		// UseCount
	    soap_body +=    '<tt:UseCount>' + params['UseCount'] + '</tt:UseCount>';
		// Encoding
	    soap_body +=    '<tt:Encoding>' + params['Encoding'] + '</tt:Encoding>';
		// Resolution
	    soap_body +=    '<tt:Resolution>';
	    soap_body +=       '<tt:Width>' + params['Resolution']['Width'] + '</tt:Width>';
	    soap_body +=       '<tt:Height>' + params['Resolution']['Height'] + '</tt:Height>';
	    soap_body +=    '</tt:Resolution>';
		// Quality
	    soap_body +=    '<tt:Quality>' + params['Quality'] + '</tt:Quality>';
		// RateControl - optional
		if (params['RateControl']) {
			soap_body +=    '<tt:RateControl>';
		    soap_body +=       '<tt:FrameRateLimit>' + params['RateControl']['FrameRateLimit'] + '</tt:FrameRateLimit>';
		    soap_body +=       '<tt:EncodingInterval>' + params['RateControl']['EncodingInterval'] + '</tt:EncodingInterval>';
		    soap_body +=       '<tt:BitrateLimit>' + params['RateControl']['BitrateLimit'] + '</tt:BitrateLimit>';
		    soap_body +=    '</tt:RateControl>';
		}
		// H264 - optional
		if (params['H264']) {
			soap_body +=    '<tt:H264>';
		    soap_body +=       '<tt:GovLength>' + params['H264']['GovLength'] + '</tt:GovLength>';
		    soap_body +=       '<tt:H264Profile>' + params['H264']['H264Profile'] + '</tt:H264Profile>';
		    soap_body +=    '</tt:H264>';
		}
		// Mpeg4 - optional
		if (params['Mpeg4']) {
			soap_body +=    '<tt:Mpeg4>';
		    soap_body +=       '<tt:GovLength>' + params['Mpeg4']['GovLength'] + '</tt:GovLength>';
		    soap_body +=       '<tt:Mpeg4Profile>' + params['Mpeg4']['Mpeg4Profile'] + '</tt:Mpeg4Profile>';
		    soap_body +=    '</tt:Mpeg4>';
		}
		// Multicast
	    soap_body +=    '<tt:Multicast>';
	    soap_body +=       '<tt:Address>';
	    soap_body +=          '<tt:Type>' + MulticastIPType + '</tt:Type>';
	    soap_body +=          '<tt:'+MulticastIPType+'Address>' + params['Multicast']['Address'][MulticastIPType+'Address'] + '</tt:'+MulticastIPType+'Address>';
	    soap_body +=       '</tt:Address>';
	    soap_body +=       '<tt:Port>' + params['Multicast']['Port'] + '</tt:Port>';
	    soap_body +=       '<tt:TTL>' + params['Multicast']['TTL'] + '</tt:TTL>';
	    soap_body +=       '<tt:AutoStart>' + params['Multicast']['AutoStart'] + '</tt:AutoStart>';
	    soap_body +=    '</tt:Multicast>';
		// SessionTimeout
	    soap_body +=    '<tt:SessionTimeout>' + params['SessionTimeout'] + '</tt:SessionTimeout>';

	    soap_body += '</trt:Configuration>';
		soap_body += '<trt:ForcePersistence>true</trt:ForcePersistence>';
		soap_body += '</trt:SetVideoEncoderConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'SetVideoEncoderConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getCompatibleVideoEncoderConfigurations(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleVideoEncoderConfigurations = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetCompatibleVideoEncoderConfigurations>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:GetCompatibleVideoEncoderConfigurations>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleVideoEncoderConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getVideoEncoderConfigurationOptions(params[, callback])
* - params:
*   - ProfileToken       | String | optional | a token of the profile
*   - ConfigurationToken | String | optional | a token of the configuration
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoEncoderConfigurationOptions = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if('ProfileToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
				reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
				return;
			}
		}

		if('ConfigurationToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
				reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
				return;
			}
		}

		let soap_body = '';
		soap_body += '<trt:GetVideoEncoderConfigurationOptions>';
		if(params['ProfileToken']) {
			soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		}
		if(params['ConfigurationToken']) {
			soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		}
		soap_body += '</trt:GetVideoEncoderConfigurationOptions>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoEncoderConfigurationOptions', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getGuaranteedNumberOfVideoEncoderInstances(params[, callback])
* - params:
*   - ConfigurationToken | String | required | a token of the configuration
*
* {
*   'ConfigurationToken': 'Configuration1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getGuaranteedNumberOfVideoEncoderInstances = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetGuaranteedNumberOfVideoEncoderInstances>';
		soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:GetGuaranteedNumberOfVideoEncoderInstances>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetGuaranteedNumberOfVideoEncoderInstances', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getProfiles([callback])
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getProfiles = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<trt:GetProfiles/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetProfiles', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getProfile(params[, callback])
* - params:
*   - ProfileToken | required | a token of the profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getProfile = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetProfile>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:GetProfile>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetProfile', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: createProfile(params[, callback])
* - params:
*   - Name  | String | required | a name of the profile
*   - Token | String | optional | a token of the profile
*
* {
*   'Name: 'TestProfile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.createProfile = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Name'], 'string')) {
			reject(new Error('The "Name" property was invalid: ' + err_msg));
			return;
		}

		if('Token' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['Token'], 'string')) {
				reject(new Error('The "Token" property was invalid: ' + err_msg));
				return;
			}
		}

		let soap_body = '';
		soap_body += '<trt:CreateProfile>';
		soap_body +=   '<trt:Name>' + params['Name'] + '</trt:Name>';
		if('Token' in params) {
			soap_body +=   '<trt:Token>' + params['Token'] + '</trt:Token>';
		}
		soap_body += '</trt:CreateProfile>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'CreateProfile', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: deleteProfile(params[, callback])
* - params:
*   - ProfileToken | String | required |
*
* {
*   'ProfileToken: 'TestProfile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.deleteProfile = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:DeleteProfile>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:DeleteProfile>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'DeleteProfile', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getVideoSources([callback])
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoSources = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<trt:GetVideoSources/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoSources', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getVideoSourceConfiguration(params[, callback])
* - params:
*   - ConfigurationToken | String | required |
*
* {
*   'ConfigurationToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoSourceConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetVideoSourceConfiguration>';
		soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:GetVideoSourceConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoSourceConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getVideoSourceConfigurations([callback])
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoSourceConfigurations = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<trt:GetVideoSourceConfigurations/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoSourceConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: addVideoSourceConfiguration(params[, callback])
* - params:
*   - ProfileToken       | String | required | a token of the Profile
*   - ConfigurationToken | String | required |
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Profile1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addVideoSourceConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:AddVideoSourceConfiguration>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:AddVideoSourceConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'AddVideoSourceConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getCompatibleVideoSourceConfigurations(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the targeted PTZ node
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleVideoSourceConfigurations = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetCompatibleVideoSourceConfigurations>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:GetCompatibleVideoSourceConfigurations>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleVideoSourceConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getVideoSourceConfigurationOptions(params[, callback])
* - params:
*   - ProfileToken       | optional | a token of the Profile
*   - ConfigurationToken | optional | a token of the configuration
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoSourceConfigurationOptions = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if('ProfileToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
				reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
				return;
			}
		}

		if('ConfigurationToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
				reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
				return;
			}
		}

		let soap_body = '';
		soap_body += '<trt:GetVideoSourceConfigurationOptions>';
		if('ProfileToken' in params) {
			soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		}
		if('ConfigurationToken' in params) {
			soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		}
		soap_body += '</trt:GetVideoSourceConfigurationOptions>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoSourceConfigurationOptions', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getMetadataConfiguration(params[, callback])
* - params:
*   - ConfigurationToken | required |
*
* {
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getMetadataConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetMetadataConfiguration>';
		soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:GetMetadataConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetMetadataConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getMetadataConfigurations([callback])
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getMetadataConfigurations = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<trt:GetMetadataConfigurations/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetMetadataConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: addMetadataConfiguration(params[, callback])
* - params:
*   - ProfileToken       | String | required | a token of the Profile
*   - ConfigurationToken | String | required |
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addMetadataConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:AddMetadataConfiguration>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:AddMetadataConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'AddMetadataConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getCompatibleMetadataConfigurations(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the Profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleMetadataConfigurations = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetCompatibleMetadataConfigurations>';
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:GetCompatibleMetadataConfigurations>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleMetadataConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getMetadataConfigurationOptions(params[, callback])
* - params:
*   - ProfileToken       | String | optional | a token of the Profile
*   - ConfigurationToken | String | optional |
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getMetadataConfigurationOptions = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if('ProfileToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
				reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
				return;
			}
		}

		if('ConfigurationToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
				reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
				return;
			}
		}

		let soap_body = '';
		soap_body += '<trt:GetMetadataConfigurationOptions>';
		if('ProfileToken' in params) {
			soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		}
		if('ConfigurationToken' in params) {
			soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		}
		soap_body += '</trt:GetMetadataConfigurationOptions>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetMetadataConfigurationOptions', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getAudioSources([callback])
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioSources = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<trt:GetAudioSources/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioSources', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getAudioSourceConfiguration(params[, callback])
* - params:
*   - ConfigurationToken | String | required |
*
* {
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioSourceConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetAudioSourceConfiguration>';
		soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:GetAudioSourceConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioSourceConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getAudioSourceConfigurations([callback])
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioSourceConfigurations = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<trt:GetAudioSourceConfigurations/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioSourceConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: addAudioSourceConfiguration(params[, callback])
* - params:
*   - ProfileToken       | String | required | a token of the Profile
*   - ConfigurationToken | String | required |
*
* {
*   'ProfileToken': 'Profile1',
*   'ConfigurationToken': 'Conf1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addAudioSourceConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:AddAudioSourceConfiguration>';
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:AddAudioSourceConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'AddAudioSourceConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getCompatibleAudioSourceConfigurations(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleAudioSourceConfigurations = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetCompatibleAudioSourceConfigurations>';
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:GetCompatibleAudioSourceConfigurations>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleAudioSourceConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getAudioSourceConfigurationOptions(params[, callback])
* - params:
*   - ProfileToken       | String | optional | a token of the Profile
*   - ConfigurationToken | String | optional |
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioSourceConfigurationOptions = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if('ProfileToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
				reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
				return;
			}
		}

		if('ConfigurationToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
				reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
				return;
			}
		}

		let soap_body = '';
		soap_body += '<trt:GetAudioSourceConfigurationOptions>';
		if('ProfileToken' in params) {
			soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		}
		if('ConfigurationToken' in params) {
			soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		}
		soap_body += '</trt:GetAudioSourceConfigurationOptions>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioSourceConfigurationOptions', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getAudioEncoderConfiguration(params[, callback])
* - params:
*   - ConfigurationToken | String | required |
*
* {
*   'ConfigurationToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioEncoderConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetAudioEncoderConfiguration>';
		soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:GetAudioEncoderConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioEncoderConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getAudioEncoderConfigurations([callback])
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioEncoderConfigurations = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<trt:GetAudioEncoderConfigurations/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioEncoderConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: addAudioEncoderConfiguration(params[, callback])
* - params:
*   - ProfileToken       | String | required | a token of the Profile
*   - ConfigurationToken | String | required |
*
* {
*   'ProfileToken': 'Profile1',
*   'ConfigurationToken': 'Conf1'
* }
*
* Not device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addAudioEncoderConfiguration = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:AddAudioEncoderConfiguration>';
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		soap_body += '</trt:AddAudioEncoderConfiguration>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'AddAudioEncoderConfiguration', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getCompatibleAudioEncoderConfigurations(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleAudioEncoderConfigurations = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetCompatibleAudioEncoderConfigurations>';
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:GetCompatibleAudioEncoderConfigurations>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleAudioEncoderConfigurations', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getAudioEncoderConfigurationOptions(params[, callback])
* - params:
*   - ProfileToken       | String | optional | a token of the Profile
*   - ConfigurationToken | String | optional |
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioEncoderConfigurationOptions = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if('ProfileToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
				reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
				return;
			}
		}

		if('ConfigurationToken' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
				reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
				return;
			}
		}

		let soap_body = '';
		soap_body += '<trt:GetAudioEncoderConfigurationOptions>';
		if('ProfileToken' in params) {
			soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		}
		if('ConfigurationToken' in params) {
			soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
		}
		soap_body += '</trt:GetAudioEncoderConfigurationOptions>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioEncoderConfigurationOptions', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: startMulticastStreaming(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the Profile
*
* {
*   'ProfileToken': 'Profile1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.startMulticastStreaming = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:StartMulticastStreaming>';
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:StartMulticastStreaming>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'StartMulticastStreaming', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: stopMulticastStreaming(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the Profile
*
* {
*   'ProfileToken': 'Profile1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.stopMulticastStreaming = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:StopMulticastStreaming>';
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:StopMulticastStreaming>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'StopMulticastStreaming', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

/* ------------------------------------------------------------------
* Method: getSnapshotUri(params[, callback])
* - params:
*   - ProfileToken | String | required | a token of the Profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getSnapshotUri = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			reject(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trt:GetSnapshotUri>';
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
		soap_body += '</trt:GetSnapshotUri>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetSnapshotUri', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

module.exports = OnvifServiceMedia;
