-------------
Create Bucket
-------------
Test bucket

* Bucket Name: dev-test-bucket-674 (change to random number)
* Region: Mumbai (ap-south-1)
* Object Ownership: ACL Enabled

* Server access logging: Un-Check
* CloudWatch request metrics:
  * Monitor requests in your bucket for an additional cost: Check

* Block public access: Un-Check
  * Block public access to buckets and objects granted through new access control lists (ACLs): Un-Check
  * Block public access to buckets and objects granted through any access control lists (ACLs): Un-Check
  * Block public access to buckets and objects granted through new public bucket policies: Un-Check
  * Block public and cross-account access to buckets and objects through any public bucket policies: Un-Check



-----------------
Create IAM policy
-----------------
* Create Your Own Policy -> Select 'JSON'
* Name: `test-policy-s3-upload`
* Description: Test policy for s3 upload access
* Policy Document:
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSignedUrlCreation",
      "Effect": "Allow",
      "Action": [
        "s3:Put*"
      ],
      "Resource": "arn:aws:s3:::dev-test-bucket-674/*"
    }
  ]
}
```



---------------
Create IAM User
---------------
* Name: `test-user`
* Access type: Programmatic access
* Attach existing policies directly: `test-policy-s3-upload`
* Note down AWS Key and Secret
