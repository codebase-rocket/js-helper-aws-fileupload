// Info: Test Cases
'use strict';

// Shared Dependencies
var Lib = {};

// Set Configrations
const fileupload_config = {
  'KEY': require('./.aws.json')['KEY'],
  'SECRET': require('./.aws.json')['SECRET'],
  'REGION': require('./.aws.json')['REGION']
};

// Dependencies
Lib.Utils = require('js-helper-utils');
Lib.Debug = require('js-helper-debug')(Lib);
Lib.Instance = require('js-helper-instance')(Lib);
const FileUpload = require('js-helper-aws-fileupload')(Lib, fileupload_config);


////////////////////////////SIMILUTATIONS//////////////////////////////////////

function test_output(response){ // Result are from previous function

  Lib.Debug.log('Output:', response );

};

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////STAGE SETUP///////////////////////////////////////

// Initialize 'instance'
var instance = Lib.Instance.initialize();

// Set test bucket
var bucket = 'dev-test-bucket-674';

// Set test upload location
var source_path = 'test_data/image.jpg';
var upload_path = 'client_upload/new_img.jpg';

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////////TESTS/////////////////////////////////////////

// Test postFileURL()
Lib.Debug.log(
  'postFileURL:',
  FileUpload.postFileURL(
    instance,
    test_output,
    bucket,
    upload_path
  )
);


/*
// Test putFileURL()
FileUpload.putFileURL(
  instance,
  test_output,
  bucket,
  upload_path
);
*/



/*
// Test getFileURL()
FileUpload.getFileURL(
  instance,
  test_output,
  bucket,
  upload_path
);
*/

///////////////////////////////////////////////////////////////////////////////
