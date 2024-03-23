// Info: Boilerplate library. Generate private signed URL that can be used to upload file on AWS S3
'use strict';

// Shared Dependencies (Managed by Loader)
var Lib = {};

// For lazy loading of AWS SDK Services
let S3Client,
  PutObjectCommand, GetObjectCommand,
  createPresignedPost,
  getSignedUrl;

// Exclusive Dependencies
var CONFIG = require('./config'); // Loader can override it with Custom-Config


/////////////////////////// Module-Loader START ////////////////////////////////

  /********************************************************************
  Load dependencies and configurations

  @param {Set} shared_libs - Reference to libraries already loaded in memory by other modules
  @param {Set} config - Custom configuration in key-value pairs

  @return nothing
  *********************************************************************/
  const loader = function(shared_libs, config){

    // Shared Dependencies (Must be loaded in memory already)
    Lib.Utils = shared_libs.Utils;
    Lib.Debug = shared_libs.Debug;
    Lib.Instance = shared_libs.Instance;

    // Override default configuration
    if( !Lib.Utils.isNullOrUndefined(config) ){
      Object.assign(CONFIG, config); // Merge custom configuration with defaults
    }

  };

//////////////////////////// Module-Loader END /////////////////////////////////



///////////////////////////// Module Exports START /////////////////////////////
module.exports = function(shared_libs, config){

  // Run Loader
  loader(shared_libs, config);

  // Return Public Funtions of this module
  return FileUpload;

};//////////////////////////// Module Exports END //////////////////////////////



///////////////////////////Public Functions START///////////////////////////////
const FileUpload = { // Public functions accessible by other modules

  /********************************************************************
  Get temporary publicaly accessible Signed-URL to upload object using http-POST method (Works in browser)

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} bucket - S3 Bucket in which file is located
  @param {String} file_key - Full path to file
  @param {Integer} [expire_time] - (Optional) URL Life Expiry in seconds. Default: 0 - Never Expire
  @param {Integer} [max_allowed_size] - (Optional) Max file size allowed in bytes. Default: 0 - No limit. 1MB = 1048576 Bytes

  @callback - Request Callback
  * Note - no error is returned, instead 'false' is returned in case of error
  * @callback {Boolean} url - false on unsuccessful or error
  * @callback {Set}
    * @callback {String} url - Signed URL
    * @callback {Set} fields - Post params for signed URL
  *********************************************************************/
  postFileURL: function(
    instance, cb,
    bucket, file_key,
    expire_time, max_allowed_size
  ){

    // Initialize AWS service Object if not already Initialized
    _FileUpload.initIfNot(instance);

    // Service Params
    var service_params = {
      'Bucket': bucket, // S3 Bucket where file is to be uploaded
      'Key': file_key, // File name with full path
      'Fields': {},
      'Conditions': []
    };

    // Add Max-File-Size to service-params if sent in params and not 0
    if( !Lib.Utils.isNullOrUndefined(max_allowed_size) && max_allowed_size > 0 ){
      service_params['Conditions'].push( ['content-length-range', 0, max_allowed_size] );
    }

    // Add Expiry to service-params if sent in params and not 0
    if( !Lib.Utils.isNullOrUndefined(expire_time) && expire_time > 0 ){
      service_params['Expires'] = expire_time;
    }


    // Generate signed url to upload publically
    Lib.Debug.timingAuditLog('Start', 'AWS S3 Signed URL - Upload file (POST)', instance['time_ms']);
    createPresignedPost( instance.aws.s3, service_params)

      .then(function(data){
        Lib.Debug.timingAuditLog('End', 'AWS S3 Signed URL - Upload file (POST)', instance['time_ms']);

        // Return signed URL
        cb({
          'url':data.url,
          'feilds':data.fields
        });

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: AWS S3 Signed URL' +
          '\ncmd: Upload File (Post)' +
          '\nparams: ' + JSON.stringify(service_params)
        );

        // Invoke Callback. In case of S3 error, return false and not error.
        cb(false);

      });

  },


  /********************************************************************
  Get temporary publicaly accessible Signed-URL to upload object using http-PUT method

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} bucket - S3 Bucket in which file is located
  @param {String} file_key - Full path to file
  @param {Integer} [expire_time] - (Optional) URL Life Expiry in seconds. Default: 0 - Never Expire

  @callback - Request Callback
  * Note - no error is returned, instead 'false' is returned in case of error
  * @callback {String} url - url with signature
  * @callback {Boolean} url - false on unsuccessful or error
  *********************************************************************/
  putFileURL: function(
    instance, cb,
    bucket, file_key,
    expire_time
  ){

    // Initialize AWS service Object if not already Initialized
    _FileUpload.initIfNot(instance);

    // Service Params for PutObjectCommand
    var service_params_put_object = {
      'Bucket': bucket, // S3 Bucket where file is to be uploaded
      'Key': file_key // File name with full path
    };

    // Service Params for getSignedUrl
    var service_params_get_signed_url = {};

    // Add Expiry to service-params if sent in params and not 0
    if( !Lib.Utils.isNullOrUndefined(expire_time) && expire_time > 0 ){
      service_params_get_signed_url['expiresIn'] = expire_time;
    }


    // Create a command with the service params
    const command = new PutObjectCommand(service_params_put_object);

    // Generate signed URL
    Lib.Debug.timingAuditLog('Start', 'AWS S3 Signed URL - Upload file (PUT)', instance['time_ms']);
    getSignedUrl( instance.aws.s3, command, service_params_get_signed_url)

      .then(function(signed_url){
        Lib.Debug.timingAuditLog('End', 'AWS S3 Signed URL - Upload file (PUT)', instance['time_ms']);

        // Return signed URL
        cb(signed_url);

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: AWS S3 Signed URL' +
          '\ncmd: Upload File (PUT)' +
          '\nparams: ' + JSON.stringify(service_params_put_object) + JSON.stringify(service_params_get_signed_url)
        );

        // Invoke Callback. In case of S3 error, return false and not error.
        cb(false);

      });

  },


  /********************************************************************
  Get temporary publicaly accessible URL for an object with Expiry

  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished

  @param {String} bucket - S3 Bucket in which file is located
  @param {String} file_key - Full path to file
  @param {Integer} [expire_time] - (Optional) URL Life Expiry in seconds. Default: 0 - Never Expire

  @return Thru request Callback.

  @callback - Request Callback
  * Note - no error is returned, instead 'false' is returned in case of error
  * @callback {String} url - url with access signature
  * @callback {Boolean} url - false on unsuccessful or error
  *********************************************************************/
  getFileURL: function(
    instance, cb,
    bucket, file_key,
    expire_time
  ){

    // Initialize AWS service Object if not already Initialized
    _FileUpload.initIfNot(instance);


    // Initialize AWS service Object if not already Initialized
    _FileUpload.initIfNot(instance);

    // Service Params for GetObjectCommand
    var service_params_get_object = {
      'Bucket': bucket, // S3 Bucket where file is to be uploaded
      'Key': file_key // File name with full path
    };

    // Service Params for getSignedUrl
    var service_params_get_signed_url = {};

    // Add Expiry to service-params if sent in params and not 0
    if( !Lib.Utils.isNullOrUndefined(expire_time) && expire_time > 0 ){
      service_params_get_signed_url['expiresIn'] = expire_time;
    }


    // Create a command with the service params
    const command = new GetObjectCommand(service_params_get_object);

    // Generate signed URL
    Lib.Debug.timingAuditLog('Start', 'AWS S3 Signed URL - Get file', instance['time_ms']);
    getSignedUrl( instance.aws.s3, command, service_params_get_signed_url)

      .then(function(signed_url){
        Lib.Debug.timingAuditLog('End', 'AWS S3 Signed URL - Get file', instance['time_ms']);

        // Return signed URL
        cb(signed_url);

      })

      .catch(function(err){

        // Log error for research
        Lib.Debug.logErrorForResearch(
          err,
          'Cause: AWS S3 Signed URL' +
          '\ncmd: Get file URL' +
          '\nparams: ' + JSON.stringify(service_params_get_object) + JSON.stringify(service_params_get_signed_url)
        );

        // Invoke Callback. In case of S3 error, return false and not error.
        cb(false);

      });

  }

};///////////////////////////Public Functions END//////////////////////////////



//////////////////////////Private Functions START//////////////////////////////
const _FileUpload = { // Private functions accessible within this modules only

  /********************************************************************
  Initialize AWS S3 Service Object - Only if not already initialized

  @param {reference} instance - Request Instance object reference

  @return - None
  *********************************************************************/
  initIfNot: function(instance){

    // Create 'aws' object in instance if it's not already present
    if( !('aws' in instance) ){
      instance['aws'] = {};
    }


    // Initialize only if 's3' object is not already Initialized
    if( !Lib.Utils.isNullOrUndefined(instance.aws.s3) ){
      return; // Do not proceed since already initalized
    }


    Lib.Debug.timingAuditLog('Init-Start', 'AWS S3 Server Connection (fileupload)', instance['time_ms']);

    // Dependency - AWS SDK - S3 Services
    ({
      S3Client,
      PutObjectCommand,
      GetObjectCommand
    } = require('@aws-sdk/client-s3')); // AWS SDK - S3 Client
    ({createPresignedPost} = require('@aws-sdk/s3-presigned-post')); // AWS SDK - POST Presigned URL
    ({getSignedUrl} = require('@aws-sdk/s3-request-presigner')); // AWS SDK - PUT Presigned URL

    // Initialize S3 object
    instance.aws.s3 = new S3Client({
      region: CONFIG.REGION,
      credentials: {
        accessKeyId: CONFIG.KEY,
        secretAccessKey: CONFIG.SECRET
      },
      maxAttempts: CONFIG.MAX_RETRIES,
      timeout: CONFIG.TIMEOUT,
      logger: Lib.Debug, // Write debug information to Lib.Debug.log() instead of console.log()
      apiVersion: '2006-03-01' // or use 'latest'
    });
    Lib.Debug.timingAuditLog('Init-End', 'AWS S3 Server Connection (fileupload)', instance['time_ms']);

  },

};//////////////////////////Private Functions END//////////////////////////////
