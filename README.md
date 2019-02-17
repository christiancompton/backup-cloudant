# CouchDB Backup & Cloud Object Storage Overview

This web application is intended to backup all documents in a CouchDB database, such as [Cloudant](https://console.bluemix.net/catalog/services/cloudant), to [IBM Cloud Object Storage](https://console.bluemix.net/catalog/services/cloud-object-storage) for IBM Cloud.

For detailed information about how to perform these operations, see the [developerWorks recipe](https://developer.ibm.com/recipes/tutorials/object-storage-cloudant-backup/) that uses this project.

It can be run in IBM Cloud or in other environments that support Node.js runtimes and can install the necessary node module dependencies.

If running in IBM Cloud and using Bound Object Storage and/or Cloudant Instances:

The application will read in the credentials for these services using the information from the VCAP Services data.  The only value you would need to supply in the file is the name of the database to be backed up.

If using non-bound CouchDB and Object Storage instances:

The information in the manifest will need to be overwritten with the credentials from the remote targets.


## How does it work?

The primary mechanism in this application is a call to the [couchbackup node module](https://developer.ibm.com/clouddataservices/2016/03/22/simple-couchdb-and-cloudant-backup/), which gets all documents from the specified database, and stores them in a text file.  Once complete, the .txt file is uploaded to Object Storage for IBM Cloud, with the name of the file as the timestamp of the transaction, inside of a container named by the YEAR-MONTH convention.


The default is to run the backup job once every 24 hours, or every 86400000 milliseconds, but this is easy to modify in the manifest.

## How to Restore:

In order to restore a database, see the [couchbackup tutorial](https://developer.ibm.com/clouddataservices/2016/03/22/simple-couchdb-and-cloudant-backup/) for detailed information.  Since restoration should not be a regular occurrence, it is not automated in this application.

The first step is to get the desired .txt file that will be used to restore - this can be done using the Object Storage user interface, or by using tools that directly connect to the Swift back end to get the file.

Once you have the file, make sure that the **couchdb** node module is installed globally, and run the following command:

```cat <filename>.txt | env COUCH_URL=<couchdb_url> couchrestore --db <name of existing db to restore>```

One very important stipulation - **the database that is being restored must exist** before this command will work.  If the database does not exist, the restore will not work.  Additionally, it is best practice to restore to a new, empty database, rather than attempt to overwrite
